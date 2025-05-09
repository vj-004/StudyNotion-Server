
import Section from "../models/Section.js";
import SubSection from "../models/SubSection.js";
import { deleteVideo, uploadImage } from "../utils/cloudinaryUtils.js";
import { returnResponse } from "../utils/specialUtils.js";

export const createSubSection = async (req,res) => {
    try{
        //videUrl we will only have to create right
        const {title,timeDuration,description,sectionId} = req.body;
        const videoFile = req.files.videoFile;

        if(!title || !timeDuration || !description || !videoFile || !sectionId){
            return returnResponse(res,400,false,"Please enter all the fields");
        }

        const uploaDetails = await uploadImage(videoFile,process.env.COURSES_VIDEOS_FOLDER);
        const videoUrl =  uploaDetails.secure_url; 

        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: videoUrl,
            publicId: uploaDetails.public_id
        });

        const updatedSection = await Section.findByIdAndUpdate(sectionId,{
            $push:{
                subSection: subSectionDetails._id,
            }
        },{new: true}).populate("subSection").exec();

        if(!updatedSection){
            return returnResponse(res,404,false,"Section not found");
        }

        console.log('Updated Section: ', updatedSection);

        return res.status(200).json({
            success: true,
            message: "Sub section created and section updated successfully",
            updatedSection,
        });

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in creating a subsection");
    }
}

export const deleteSubSection = async (req,res) => {
    try{

        const {subSectionId} = req.body;
        const subSectionDetails = await SubSection.findById(subSectionId);
        if(!subSectionDetails){
            return returnResponse(res,404,false,"Subsection not found");
        }
        const deletedVideo = deleteVideo(subSectionDetails.publicId);
        const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

        return returnResponse(res,200,true,"SubSection deleted successfully");


    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in deleting subsection");
    }
}

export const updateSubSection = async (req,res) => {
    try{

        const {sectionId,title,timeDuration} = req.body;  
        const videoFile = req.files.videoFile;
        if(!sectionId && !title && !timeDuration && !videoUrl && !videoFile){
            return returnResponse(res,200,true,"Nothing to update. Update successfull");
        }
        //console.log('title: ', title);
        const subSectionDetails = await SubSection.findById(sectionId);
        //console.log('subSection: ', subSectionDetails);
        if(videoFile){
            const deletedVideo = await  deleteVideo(subSectionDetails.publicId);
            const uploaDetails = await uploadImage(videoFile,process.env.COURSES_VIDEOS_FOLDER);
            const newVideoUrl =  uploaDetails.secure_url; 
            subSectionDetails.videoUrl = newVideoUrl;
        }
        if(title){
            subSectionDetails.title = title;
        }
        if(timeDuration){
            subSectionDetails.timeDuration = timeDuration;
        }
        
        await subSectionDetails.save(); 

        return returnResponse(res,200,true,"Updated sub section successfully");
        
    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in updating subsection");
    }
}
