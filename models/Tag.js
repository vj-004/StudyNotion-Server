import mongoose from "mongoose";

const TagSchema = new mongoose.Schema({
    //Make better schema
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    },
});

const Tag = mongoose.model("Tag", TagSchema);
export default Tag;