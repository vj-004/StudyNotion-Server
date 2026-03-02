import mongoose from "mongoose";


const PlaylistSchema = new mongoose.Schema(
    {
        playlist_id: {
            type: String,
            required: true
        },
        video_ids: {
            type: [String],
            default: [],
        },
        // thumbnail: {

        // }
    }
);

const Playlist = mongoose.model("Playlist", PlaylistSchema);
export default Playlist;