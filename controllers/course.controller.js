//create course handler function

import Course from "../models/Course.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import { uploadImage } from "../utils/cloudinaryUtils.js";
import { returnResponse } from "../utils/specialUtils.js";
import SubSection from "../models/SubSection.js";
import Section from "../models/Section.js";

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
