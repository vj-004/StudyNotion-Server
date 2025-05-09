import Course from "../models/Course.js";
import Profile from "../models/Profile.js";
import User from "../models/User.js";
import { uploadImage } from "../utils/cloudinaryUtils.js";
import { returnResponse } from "../utils/specialUtils.js";

export const updateProfile = async (req,res) => {
    try{

        const {gender,contactNumber,dateOfBirth,about} = req.body;
        const id = req.user.id;
        if(!gender && !contactNumber && !dateOfBirth && !about){
            return returnResponse(res,200,true,"Nothing to update. Updated Successfully");
        }

        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;
        const updatedProfileDetails = await Profile.findByIdAndUpdate(profileId,{
            dateOfBirth: dateOfBirth,
            gender: gender,
            about: about,
            contactNumber: contactNumber,
        },{new: true});

        if(!updateProfile){
            return returnResponse(res,404,false,"Profile not found");
        }

        return returnResponse(res,200,true,"Profile details updated successfully", updatedProfileDetails);

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error while updating profile");
    }
}


//explore how can we schedule this deletion operation
//what is a CRON JOB ??
export const deleteAccount = async (req,res) => {
    try{
        console.log('user: ', req.user);
        const id = req.user.id;
        const userDetails = await User.findById(id);

        if(!userDetails){
            return returnResponse(res,404,false,"User not found");
        }

        await Profile.findByIdAndDelete(userDetails.additionalDetails);
        //unenrolling student from all courses which he is part of
        // if its a teacher then I will have to delete all of his courses also right?? I am keeping all his courses for now
        if(userDetails.accountType === "student"){
            for(const courseId of userDetails.courses){
                const course = await Course.findByIdAndUpdate(courseId,{
                    $pull:{
                        studentsEnrolled: id,
                    },           
                },{new: true});
                
            }
        }
        await User.findByIdAndDelete(id);
        //TODO: need to delete the thubnail also....
        return returnResponse(res,200,true,"User deleted successfully");

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in deleting account");
    }
}

export const updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImage(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

export const getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		const userDetails = await User.findById(id)
			.populate("additionalDetails")
			.exec();
		console.log(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

