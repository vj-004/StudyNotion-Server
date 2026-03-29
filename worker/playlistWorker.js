import { Worker } from "bullmq";
import { playlistStatus } from "../constants.js";
import User from "../models/User.js";
import { connectDB } from "../config/db.js";
import dotenv from "dotenv";
import Playlist from "../models/Playlist.js";
import { GoogleGenAI } from "@google/genai";
import IORedis from "ioredis";

dotenv.config({path: "../.env"});
await connectDB();

const getAllVideosData = async (playlist_id) => {

    let videoids = [];
    let snippets = [];
    let pageToken = "";
    let maxRes = 50;
    let thumbnail;
    let title;
    
    try{

        const youtubePlaylistAPI = `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlist_id}&fields=items(id,snippet(title),snippet(thumbnails(default)))&key=${process.env.GOOGLE_API}`;
        const response = await fetch(
            youtubePlaylistAPI,
            {
                method: "GET",
                headers: {
                "Accept": "application/json",
                },
            }
        );

        const data = await response.json();


        if (!data.items || data.items.length === 0) {
            return {
                status: false,
                message: "Invalid Youtube URL"
            };
        }
        title = data.items[0].snippet.title;
        thumbnail = data.items[0].snippet.thumbnails.default;

    }
    catch(error){
        console.log('Error in trying to find the playlist', error);
        return {
                status: false,
                message: "Server Error"
            };
    }

    try{
        do{
            const youtuberAPI = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxRes}&pageToken=${pageToken}&playlistId=${playlist_id}&fields=nextPageToken,items(snippet(title,description,resourceId/videoId))&key=${process.env.GOOGLE_API}`;
            const response = await fetch(
                youtuberAPI,
                {
                    method: "GET",
                    headers: {
                    "Accept": "application/json",
                    },
                }
            );

            
            const data = await response.json();

            for(const item of data.items){
                const id = item.snippet.resourceId.videoId;
                videoids.push(id);
                const snip = {
                    videoId: id,
                    title: item.snippet.title,
                    description: item.snippet.description
                }
                snippets.push(snip);
            }

            pageToken = data.nextPageToken;
        
        }while(pageToken);
    }
    catch(error){
        console.log('Error in trying to find the playlist videos', error);
        return {
            status: false,
            message: "Server Error"
        };
    }

    
    return {
        title,
        thumbnail,
        videoids,
        snippets,
        status: true,
        message: "Youtube videos received successfully"
    };
}

const redis = new IORedis(6379, '127.0.0.1');

const work = async (job) => {

    
    const {playlistId, userId} = job.data;
    const {status, title, thumbnail, snippets, message} = await getAllVideosData(playlistId);

    if(status === false){
        const user = await User.findOneAndUpdate(
            {
                _id: userId,
                "ytCourses.url_id": playlistId
            },
            {
                $set: {
                    "ytCourses.$.status": playlistStatus.FAILED,
                    "ytCourses.$.statusMessage" : message
                }
            }
        );
        if(user === null){
            console.log('Wrong data sent to worker');
        }
        return;
    }

    const count = await redis.incr("gemini:daily:count");

    // Set TTL only first time
    if (count === 1) {
      await redis.expire("gemini:daily:count", 86400);
    }

    if(count > 15){
        const user = await User.findOneAndUpdate(
            {
                _id: userId,
                "ytCourses.url_id": playlistId
            },
            {
                $set: {
                    "ytCourses.$.status": playlistStatus.FAILED,
                    "ytCourses.$.statusMessage" : "Please try again after midnight. API rate limit reached"
                }
            }
        );
        console.log('rate limit reached');
        return;
    }


    const prompt = `You are an AI system that converts a list of YouTube videos into a structured course.

        Each item in the input is an object with:
        - title
        - description
        - videoId (this is the videoId)

        Your task is to group videos into logical sections (like a course curriculum).

        Instructions:
        1. Use the video title as the primary signal to understand the topic.
        2. Use the description ONLY if it contains meaningful information about the video content.
        - Ignore descriptions that contain only links, promotions, or irrelevant text.
        3. Group videos into sections based on similarity of topics.
        4. Maintain the original playlist order while grouping.

        Section Rules:
        - Each section must have:
        - "title": a concise name describing the topic
        - "videoIds": an ordered list of video IDs (use resourceId.videoId)

        Important Constraints:
        - If the topic of videos is unclear → DO NOT group them
        - If videos appear unrelated → DO NOT group them
        - If a video is long (e.g., ~1–2 hours) → if necessary keep it as a separate section
        - If you are NOT confident → create one section per video

        Fallback Behavior:
        If meaningful grouping is NOT possible, return one section per video.

        Output Requirements (STRICT):
        - Return ONLY valid JSON
        - Output MUST be an array of objects
        - Each object MUST have:
        - "title": string
        - "videoIds": array of strings
        - Do NOT include any extra fields
        - Do NOT include explanations or text outside JSON

        Input:
        ${JSON.stringify(snippets)}`;

    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
            type: "array",
            items: {
                type: "object",
                properties: {
                title: { type: "string" },
                videoIds: {
                    type: "array",
                    items: { type: "string" }
                }
                },
                required: ["title", "videoIds"]
            }
            }
        }
    });

    // console.log('response: ', response);

    const result = response.text;
    const sections = JSON.parse(result);

    const playlist = await Playlist.create({
        playlist_id: playlistId,
        section: sections,
        videosDetails: snippets,
        status: playlistStatus.PROCESSING,
        playlistDetails:{
            title,
            thumbnail,
        }
    });

    const user = await User.findOneAndUpdate(
        {
            _id: userId,
            "ytCourses.url_id": playlistId
        },
        {
            $set: {
                "ytCourses.$.playlist": playlist._id,
                "ytCourses.$.status": playlistStatus.READY,
                "ytCourses.$.statusMessage" : "Your youtube course is ready"
            }
        }
    );

    return;

}

const worker = new Worker("playlist-queue", async (job) => work(job), {
    connection: {
        host: '127.0.0.1',
        port: 6379
    }
});

worker.on("completed", job => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.log(`Job ${job?.id} failed:`, err);
});

worker.on("error", err => {
    console.log("Worker error:", err);
});