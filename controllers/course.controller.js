//create course handler function

import Course from "../models/Course.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import { uploadImage } from "../utils/cloudinaryUtils.js";
import { returnResponse } from "../utils/specialUtils.js";

export const createCourse = async (req,res) => {
    try{
        //console.log('req.body', req.body);
        const {courseName,courseDescription,whatYouWillLearn,price,category,status,tag,instructions} = req.body;
        const thumbnail = req.files.thumbnail;
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
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor:userId,
            whatYouWillLearn,
            price,
            category: categoryDetails._id,
            thumbnail:thumbnailImage.secure_url,
            tag,
            status,
            instructions
        });

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

        if(!courseDetails){
            return returnResponse(res,404,false,"Course not found");
        }

        return returnResponse(res,200,true,"Course details fetched successfully", courseDetails);

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in gettting course");
    }
}

export const getDraftCourse = async (req,res) => {

    try{

        const id = req.user.id;

        const draftCourse = await Course.findOne({
            instructor: id,
            status: "Draft"
        });

        if(!draftCourse){
            return returnResponse(res,200,true,"No draft course", draftCourse);
        }

        return returnResponse(res,200,true,"Draft course found", draftCourse);


    }catch(error){
        console.log('Error in returning draft course', error);
    }
}

export const editCourse = async(req, res) => {

    const formData = req.body;
    
    const course_to_edit = await Course.findById(formData.courseId);

    if(!course_to_edit){
        return returnResponse(res,404,false,"Course not found");
    }

    course_to_edit.set(formData);
    await course_to_edit.save();

    return returnResponse(res,200,true,"Course has been updated successfully", course_to_edit);
}
