//create course handler function

import Course from "../models/Course.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import { uploadImage } from "../utils/cloudinaryUtils.js";
import { returnResponse } from "../utils/specialUtils.js";
import SubSection from "../models/SubSection.js";
import Section from "../models/Section.js";
import Playlist from "../models/Playlist.js";
import CourseProgress from "../models/CourseProgress.js";
import { GoogleGenAI } from "@google/genai";
import { playlistStatus } from "../constants.js";
import { playlistQueue } from "../config/playlistQueue.js";

export const createCourse = async (req,res) => {

    try{
        //console.log('req.body', req.body);
        const {courseName,courseDescription,whatYouWillLearn,price,category,status,tag,instructions} = req.body;
        const thumbnail = req.files.thumbnail;

        // console.log('req.body', req.body);
        //console.log('req.files',req.files);
        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !category || 
            !thumbnail ||
            !tag){
            return returnResponse(res,400,false,"All fields are required");
        }

        const userId = req.user.id;
        //userId is the instructor id so we don't need to make DB call for the instructor again

        //check if given category is valid or not
        const categoryDetails = await Category.findById(category);
        if(!categoryDetails){
            return returnResponse(res,404,false,"category details not found");
        }

        //upload image to cloudinary
        const thumbnailImage = await uploadImage(thumbnail, process.env.THUMBNAIL_FOLDER);
        
        //create an entry for new course
        let newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: userId,
            whatYouWillLearn,
            price,
            category: categoryDetails._id,
            thumbnail:thumbnailImage.secure_url,
            tag: JSON.parse(tag),
            status,
            instructions: JSON.parse(instructions)
        });

        newCourse["category"] = category;

        //add the new course to user schema of instructor
        await User.findByIdAndUpdate(
            {_id: userId},
            {
                $push:{
                    courses: newCourse._id,
                }
            },
            {new: true}
        );

        await Category.findByIdAndUpdate(
            {_id: categoryDetails._id},
            {
                $push:{
                    courses: newCourse._id
                }
            },
            {new: true}
        );


        return res.status(200).json({
            success: true,
            message: "New course created successfully",
            data: newCourse,
        });

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in creating course");
    }
}

export const showAllCourses = async (req,res) => {
    try{
        const allCourses = Course.find({});
        return res.status(200).json({
            success: true,
            message: "All courses returned successfully",
            allCourses,
        });

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in showing all courses");
    }
}

export const getCourseDetails = async (req,res) => {

    try{    
        const {courseId} = req.body;
        if(!courseId){
            return returnResponse(res,400,false,"Please provide courseId");
        }
        const courseDetails = await Course.findById(courseId)
        .populate({
            path: "courseContent",
            populate:{
                path: "subSection",
            }
        })
        .populate({
            path: "instructor",
            populate:{
                path: "additionalDetails"
            }
        })
        .populate("category")
        //.populate("ratingsAndReviews")
        .exec();

        let courseProgressCount = await CourseProgress.findOne({
            courseId: courseId,
        });

        

        if(!courseDetails){
            return returnResponse(res,404,false,"Course not found");
        }

        return returnResponse(res,200,true,"Course details fetched successfully", {courseDetails});

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in gettting course");
    }
}

export const getDraftCourse = async (req,res) => {

    try{

        const id = req.user.id;

        const courseToBeEdited = await Course.findOne({
            instructor: id,
            status: "Draft"
        })
        .populate({
            path: "courseContent",
            populate:{
                path: "subSection",
            }
        })
        .populate("category")
        .exec();
        ;
        // console.log('draft course: ', courseToBeEdited);
        if(!courseToBeEdited){
            return returnResponse(res,200,false,"No draft course", courseToBeEdited);
        }

        return returnResponse(res,200,true,"Draft course found", courseToBeEdited);


    }catch(error){
        console.log('Error in returning draft course', error);
    }
}

export const editCourse = async(req, res) => {

    const updates = req.body;
    const {courseId} = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" })
    }

    if (req.files && req.files.thumbnail) {
      console.log("thumbnail update")
      const thumbnail = req.files.thumbnail
      const thumbnailImage = await uploadImage(
        thumbnail,
        process.env.FOLDER_NAME
      )
      course.thumbnail = thumbnailImage.secure_url
    }

    
    // Update only the fields that are present in the request body
    for (const key in updates) {
        if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key]);
        } else {
            course[key] = updates[key];
        }
    }
    
    await course.save();

    const updatedCourse = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingsAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()

    return returnResponse(res,200,true,"Course has been updated successfully", updatedCourse);
}

export const getInstructorCourses = async (req,res) => {
    try{
        
        const instructorId = req.user.id;
        const allInstructorCourses = await Course.find({instructor: instructorId}).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "All courses returned successfully",
            data: allInstructorCourses,
        });

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in showing all instructor courses");
    }
}

export const deleteCourse = async (req,res) => {

    try{

        const instructorId = req.user.id;
        const {courseId} = req.body;
        if(!courseId){
            return returnResponse(res,404,false,"Course not found");
        }
        const instructorUpdate = await User.findByIdAndUpdate(instructorId,{
            $pull : {courses: courseId}
        },{ new: true });

        const courseToDelete = await Course.findByIdAndDelete(courseId)
        .populate({
            path: "courseContent",
        })
        .exec();
        
        // console.log('courseToDelete', courseToDelete);
        if(!courseToDelete){
            return returnResponse(res,404,false,"Course not found");
        }
        if(courseToDelete.instructor.toString() !== instructorId){
            return returnResponse(res,401,false,"You are not authorized to delete this course");
        }
        for(const section of courseToDelete.courseContent){
            for(const lecture of section.subSection){
                const deleteLecture = await SubSection.findByIdAndDelete(lecture);
                // console.log('subSection to be delete', lecture);
            }
            const deleteSection = await Section.findByIdAndDelete(section._id);
            // console.log('section to be delete', section._id)
        }

        return returnResponse(res,200,true,"Course has been deleted successfully");

    }catch(error){
        console.log('Error in deleting the course', error);
        return returnResponse(res,500,false,"Error in deleting the course");
    }

}

export const getCourseByCategory = async (req,res) => {

    const {categoryId} = req.body;
    // console.log('category name is ', categoryId);
    try{

        if(!categoryId){
            return returnResponse(res,404,false,"Please enter a valid category name");
        }

        const categoryToFind = await Category.findById(categoryId);
        // console.log(categoryToFind);
        if(!categoryToFind){
            return returnResponse(res,401,false,"Category not valid");
        }
        // console.log(categoryToFind);    
        const coursesByCategory = await Course.find({
            category: categoryId,
            status: "Public"
        })
        .populate({
            path: "instructor"
        });

        // console.log('courses are', coursesByCategory);
        return returnResponse(res,200,true,"Courses of the categories request successfull", coursesByCategory);

    }catch(error){
        console.log('Error in getting courses by category');
        return returnResponse(res,500,false,"Error in fetching courses by category", error);
    }
}

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

        title = data.snippet.title;
        thumbnail = data.snippet.thumbnails.default;

    }
    catch(error){
        console.log('Error in trying to find the playlist', error);
    }

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

    
    return {
        title,
        thumbnail,
        videoids,
        snippets
    };
}

export const createYoutubeCourse = async (req, res) => {

    
    const {playlistURL, playlistName, descp} = req.body;
    const userId = req.user.id;

    if(!playlistURL || !playlistName || !userId || !descp){
        return returnResponse(res,404,false,"Please provide all the details");
    }

    try{

        const user = await User.findById(userId);
    
        if(!user){
            console.log('User not found');
            return res.status(404).json({
                "success": false,
                "message": "user not found"
            })
        }

        const exists = user.ytCourses.some(course => course.url_id === playlistURL);
        if(exists){
            return returnResponse(res,200, false, "Course is already present with the user");
        }

        let video_ids;
        const pL = await Playlist.findOne({
            "playlist_id": playlistURL
        });

        if(pL){



            let isCompletedList = [];
            // console.log('isCompleted List',isCompletedList);
            await User.updateOne(
                { _id: userId }, 
                { $push: {
                    ytCourses: {
                        playlist: pL._id,
                        title: playlistName,
                        url_id: playlistURL,
                        description: descp
                    },
                    ytCourseProgress: {
                        playlistUrl: playlistURL,
                        isCompleted: isCompletedList
                    }
                }}
            );

            const returnData = {
                ytCourses: {
                    playlist: pL,
                    title: playlistName,
                    url_id: playlistURL,
                    description: descp
                },
                ytCourseProgress: {
                    playlistUrl: playlistURL,
                    isCompleted: isCompletedList
                }
            }

            return res.status(200).json({
                "success": true,
                "data": returnData,
                "message": "Playlist created and successfully added to user, playlist existed before"
            });

        }
        
        const {videoids} = await getAllVideosData(playlistURL);
        const playlist = await Playlist.create({
            playlist_id: playlistURL,
            video_ids: videoids
        });

        let isCompletedList = [];

        
        await User.updateOne(
            { _id: userId }, 
            { $push: {
                ytCourses: {
                    playlist: playlist._id,
                    title: playlistName,
                    url_id: playlistURL,
                    description: descp
                },
                ytCourseProgress: {
                    playlistUrl: playlistURL,
                    isCompleted: isCompletedList
                }
            }}
        );

        const returnData = {
            ytCourses: {
                playlist: playlist,
                title: playlistName,
                url_id: playlistURL,
                description: descp
            },
            ytCourseProgress: {
                playlistUrl: playlistURL,
                isCompleted: isCompletedList
            }
        }

        return res.status(200).json({
            "success": true,
            "data": returnData,
            "message": "Playlist created and successfully added to user"
        });

        
        
        

    }
    catch(error){

        console.log('Error in adding playlist');
        console.log(error);
        return res.status(500).json({
            "success": false,
            "message": "Server error in adding playlist"
        });
    
    }
}

export const createYoutubeCourseV2 = async (req, res) => {

    const {playlistURL, playlistName, descp} = req.body;
    const userId = req.user.id;

    if(!playlistURL || !playlistName || !userId || !descp){
        return returnResponse(res,404,false,"Please provide all the details");
    }

    try{

        const user = await User.findById(userId);
    
        if(!user){
            console.log('User not found');
            return res.status(404).json({
                "success": false,
                "message": "user not found"
            })
        }

        const exists = user.ytCourses.some(course => course.url_id === playlistURL);
        if(exists){
            return returnResponse(res,200, false, "Course is already present with the user");
        }

         const pL = await Playlist.findOne({
            "playlist_id": playlistURL
        });

        if(pL){

            let isCompletedList = [];
            await User.updateOne(
                { _id: userId }, 
                { $push: {
                    ytCourses: {
                        playlist: pL._id,
                        title: playlistName,
                        url_id: playlistURL,
                        description: descp
                    },
                    ytCourseProgress: {
                        playlistUrl: playlistURL,
                        isCompleted: isCompletedList
                    }
                }}
            );

            const returnData = {
                ytCourses: {
                    playlist: pL,
                    title: playlistName,
                    url_id: playlistURL,
                    description: descp
                },
                ytCourseProgress: {
                    playlistUrl: playlistURL,
                    isCompleted: isCompletedList
                }
            }

            return res.status(200).json({
                "success": true,
                "data": returnData,
                "message": "Playlist created and successfully added to user, playlist existed before"
            });

        }

    
        const {status, title, snippets} = await getAllVideosData(playlistURL);

        if(status === false){
            return returnResponse(res,404,false,"The given playlist URL is not valid");
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
            playlist_id: playlistURL,
            section: sections,
            videosDetails: snippets
        });

        // console.log('playlist: ', playlist);

        let isCompletedList = [];

        await User.updateOne(
            { _id: userId }, 
            { $push: {
                ytCourses: {
                    playlist: playlist._id,
                    title: playlistName,
                    url_id: playlistURL,
                    description: descp
                },
                ytCourseProgress: {
                    playlistUrl: playlistURL,
                    isCompleted: isCompletedList
                }
            }}
        );

        const returnData = {
            ytCourses: {
                playlist: playlist,
                title: playlistName,
                url_id: playlistURL,
                description: descp
            },
            ytCourseProgress: {
                playlistUrl: playlistURL,
                isCompleted: isCompletedList
            }
        }

        return res.status(200).json({
            "success": true,
            "data": returnData,
            "message": "Playlist created and successfully added to user"
        });

    }
    catch(error){
        console.log('Error in adding playlist');
        console.log(error);
        return res.status(500).json({
            "success": false,
            "message": "Server error in adding playlist"
        });
    }

}

export const createYoutubeCourseV3 = async (req, res) => {

    const {playlistURL, playlistName, descp} = req.body;
    const userId = req.user.id;

    if(!playlistURL || !playlistName || !userId || !descp){
        return returnResponse(res,404,false,"Please provide all the details");
    }

    try{

        const user = await User.findById(userId);
    
        if(!user){
            console.log('User not found');
            return res.status(404).json({
                "success": false,
                "message": "user not found"
            })
        }

        const exists = user.ytCourses.some(course => (course.url_id === playlistURL) && (course.status !== playlistStatus.FAILED));
        if(exists){
            return returnResponse(res,200, false, "Course is already present with the user");
        }

        const pL = await Playlist.findOne({
            "playlist_id": playlistURL
        });

        if(pL){

            let isCompletedList = [];
            await User.updateOne(
                { _id: userId }, 
                { $push: {
                    ytCourses: {
                        playlist: pL._id,
                        title: playlistName,
                        url_id: playlistURL,
                        description: descp,
                        status: playlistStatus.READY,
                        statusMessage: "Your course is ready",
                    },
                    ytCourseProgress: {
                        playlistUrl: playlistURL,
                        isCompleted: isCompletedList,
                        totalLectures: pL.videosDetails.length,
                    }
                }}
            );

            const returnData = {
                ytCourses: {
                    playlist: pL,
                    title: playlistName,
                    url_id: playlistURL,
                    description: descp,
                    status: playlistStatus.READY,
                    statusMessage: "Your course is ready",
                },
                ytCourseProgress: {
                    playlistUrl: playlistURL,
                    isCompleted: isCompletedList
                }
            }

            return res.status(200).json({
                "success": true,
                "data": returnData,
                "message": "Playlist created and successfully added to user, playlist existed before"
            });

        }

        const createCourseQueue = playlistQueue;
        const queueResult = await createCourseQueue.add(`playlistId: ${playlistURL}`, {
            playlistId: playlistURL,
            userId,
        });

        await User.updateOne(
            { _id: userId }, 
            { $push: {
                ytCourses: {
                    playlist: null,
                    title: playlistName,
                    url_id: playlistURL,
                    description: descp,
                    status: playlistStatus.PROCESSING,
                    statusMessage: "We are currently processing your course",
                    playlistDetals: {}
                },
                ytCourseProgress: {
                    playlistUrl: playlistURL,
                    isCompleted: [],
                    totalLectures: 0,
                }
            }}
        );

        return returnResponse(res,200,true,"Youtube is course has started processing", queueResult);
    
    }
    catch(error){
        console.log('Error in adding playlist');
        console.log(error);
        return res.status(500).json({
            "success": false,
            "message": "Server error in adding playlist"
        });
    }

}

export const markComplete = async (req, res) => {

    const userId = req.user.id;
    const {playlistUrl, videoId} = req.body;
    console.log('req.body', req.body);

    if(!userId || !playlistUrl || !videoId){
        return returnResponse(res,404,false,"Please provide all the details");
    }

    try{

         const user = await User.findById(userId);
    
        if(!user){
            console.log('User not found');
            return res.status(404).json({
                "success": false,
                "message": "user not found"
            })
        }

        const exists = user.ytCourseProgress.some(courseProgress => courseProgress.playlistUrl === playlistUrl);
        if(!exists){
            return returnResponse(res,404, false, "This course was not found");
        }

        const updatedUser = await User.findOneAndUpdate(
            {
                _id: userId,
                "ytCourseProgress.playlistUrl": playlistUrl
            },
            {
                $addToSet: {
                "ytCourseProgress.$.isCompleted": videoId
                }
            },
            { new: true }
        );

        const updatedCourseProgress = updatedUser.ytCourseProgress.find((courseProgress) => courseProgress.playlistUrl === playlistUrl);

        return returnResponse(res,200,true,"Video Marked Completed Successfully", updatedCourseProgress);




    }catch(error){
        console.log('error in marking a lecture as complete', error);
        return res.status(500).json({
            "success": false,
            "message": "Server error in marking a lecture as complete"
        });
    }

}

export const getAllYtCourses = async (req,res) => {

    const userId = req.user.id;
    if(!userId){
        return returnResponse(res,404, false, "User not found");
    }

    try{    

        const user = await User.findById(userId).populate("ytCourses.playlist");
        if(!user){
            console.log('User not found');
            return res.status(404).json({
                "success": false,
                "message": "user not found"
            })
        }

        const ytCourses = user.ytCourses;
        
        return returnResponse(res, 200, true, "All playlist were retreived", ytCourses);


    }catch(error){
        console.log('Error in getting youtube playlists', error);
    }

}

export const getYtCourseById = async (req,res) => {

    const userId = req.user.id;
    const {playlistId} = req.body;
    if(!userId){
        return returnResponse(res,404, false, "User not found");
    }

    if(!playlistId){
        return returnResponse(res,404, false, "Please enter the youtube course id");
    }
    // console.log('playlistId: ', playlistId);
    try{    

        const playlist = await Playlist.find({playlist_id: playlistId});
        if(!playlist){
            console.log('Playlist not found');
            return res.status(404).json({
                "success": false,
                "message": "Playlist not found"
            })
        }
        
        return returnResponse(res, 200, true, "All playlist were retreived", playlist[0]);


    }catch(error){
        console.log('Error in getting youtube playlist', error);
        return returnResponse(res,500, false, "Internal server error");
    }

}
