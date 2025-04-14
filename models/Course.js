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
    whatYouWillLearn: {
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "tags",
    },
    studentsEnrolled: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    ]
});

const Course = mongoose.model("Course", CourseSchema);
export default Course;