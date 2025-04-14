import mongoose from "mongoose";

const RatingsAndReviewsSchema = new mongoose.Schema({
    
    user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    },
    rating:{
        type: Number,
        required: true,
    },
    review:{
        type: String,
        required: true,
    }
});

const RatingAndReview = mongoose.model("Profile",RatingsAndReviewsSchema);
export default RatingAndReview;