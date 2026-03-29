import mongoose from "mongoose";


const PlaylistSchema = new mongoose.Schema(
    {
        playlist_id: {
            type: String,
            required: true
        },
        section:[
            {
                title: {
                    type: String,
                    default: ""
                },
                videoIds:[
                    {
                        type: String,
                        default: []
                    }
                ]
            }
        ],
        videosDetails:[
            {
                videoId:{
                    type: String,
                    default: ""
                },
                title: {
                    type: String,
                    default: ""
                },
                description: {
                    type: String,
                    default: ""
                }
            }
        ],
        playlistDetails: {
            title: {
                type: String,
            },
            thumbnail: {
                url: {
                    type: String,
                },
                width: {
                    type: Number,
                },
                height: {
                    type: Number
                },
            },
        },
    }
);

const Playlist = mongoose.model("Playlist", PlaylistSchema);
export default Playlist;