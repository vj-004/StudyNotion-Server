import Course from "../models/Course.js";
import RatingAndReview from "../models/RatingAndReview.js";
import { returnResponse } from "../utils/specialUtils.js";

export const createRating = async (req,res) => {
    try{    
        const {rating,review,courseId} = req.body;
        const userId = req.user.id;

        if(!rating || !review || !courseId){
            return returnResponse(res,400,false,"Fill all the details");
        }
        if(!userId){
            return returnResponse(res,401,false,"You are not authorized to make a review");
        }

        const courseDetails = await Course.findById(courseId);
        if(!courseDetails){
            return returnResponse(res,404,false,"Course not found");
        }

        if(!courseDetails.studentsEnrolled.includes(userId)){
            return returnResponse(res,401,false,"You are not authorized to create a review for this course");
        }

        const alreadyReview = await RatingAndReview.findOne({
            user: userId,
            course: courseId
        });

        if(alreadyReview){
            return returnResponse(res,403,false,"Course is already reviewed by the user");
        }

        const newReview = await RatingAndReview.create({
            user: userId,
            rating,
            review
        });

        if(!newReview){
            return returnResponse(res,400,false, "Could not create new review");
        }

        const updatedCourse = await Course.findByIdAndUpdate(courseId,
            {
                $push: {ratingsAndReviews: newReview._id}
            },
            {new: true}           
        );
        
        console.log(updatedCourse);
        

        return returnResponse(res,200,true,"Review created successfully");

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Could not create a review");
    }
}

export const getAvgRating = async (req,res) => {
    try{
        
        const courseId = req.body.courseId;
        const currCourse = await Course.findById(courseId).populate("ratingsAndReviews").exec();

        if(!currCourse){
            return returnResponse(res,404,false,"Course not found");
        }
        let totalRatings = 0;
        for(let ratingAndReview of currCourse.ratingsAndReviews){
            totalRatings = totalRatings + ratingAndReview.rating;
        }
        let avgRating = totalRatings/(currCourse.ratingsAndReviews.length);

        /*
            Another way to calculate average rating
            const result = await RatingAndReview.aggregate([
                {
                    $match:{
                        course: new mongoose.Types.ObjectId(courseId),
                    }
                },
                {
                    $group:{
                        _id: null,
                        averageRating: {$avg: "$rating"}
                    }
                }
            ])

            if(result.length > 0){
                return returnResponse(res,200,true,"Avg rating calculated succesffuly",{averageRating: result[0].averageRating});
            }
            else{
                return returnResponse(res,200,true,"Avg rating is 0, not ratings given till now",{averageRating: 0});
            }
        */

    
        return returnResponse(res,200,true,"Average rating calculated successfully",{
            averageRating: avgRating
        });
        
    }catch(error){
        console.log(erorr);
        return returnResponse(res,500,false,"Error in getting average of all reviews");
    }
}

export const getAllRatings = async (req,res) => {
    try{

        const allReviews = await RatingAndReview.find({})
        .sort({rating: "desc"})
        .populate({
            path: "user",
            select: "firstName lastName email image"
        })
        .populate({
            path: "course",
            select: "courseName"
        })
        .exec();

        return returnResponse(res,200,true,"All ratings fetched successfully",{
            data: allReviews
        })


    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in getting all Ratings");
    }
}