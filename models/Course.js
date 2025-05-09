import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
    courseName:{
        type:String,
        required:true,
    },
    courseDescription:{
        type: String,
        required: true,
    },
    instructor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    whatYouWillLearn: { // do we need this field??
        type: String,
    },
    courseContent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Section"
    }],
    ratingsAndReviews:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RatingAndReview"
        }
    ],
    price: {
        type: Number,
        required: true,
    },
    thumbnail: {
        type: String
    },
    tag: {
		type: [String],
		required: true,
	},
    category: { // we are keeping only a single tag for each course
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    studentsEnrolled: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    ],
    instructions: {
		type: [String],
	},
	status: {
		type: String,
		enum: ["Draft", "Published"],
	},
});

const Course = mongoose.model("Course", CourseSchema);
export default Course;