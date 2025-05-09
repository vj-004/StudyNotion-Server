import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    //Make better schema
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    }],
});

const Category = mongoose.model("Category", CategorySchema);
export default Category;