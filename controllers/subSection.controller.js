
import Section from "../models/Section.js";
import SubSection from "../models/SubSection.js";
import { deleteVideo, uploadImage } from "../utils/cloudinaryUtils.js";
import { returnResponse } from "../utils/specialUtils.js";

export const createSubSection = async (req,res) => {
    try{
        const { sectionId, title, description } = req.body
        const video = req.files?.video
        console.log(video)
        // Check if all necessary fields are provided
        if (!sectionId || !title || !description || !video) {
            return res
            .status(404)
            .json({ success: false, message: "All Fields are Required" })
        }
        console.log(video)
        console.log('uploading videos');
        const uploaDetails = await uploadImage(video,process.env.COURSES_VIDEOS_FOLDER);
        const videoUrl =  uploaDetails.secure_url; 
        console.log('done uploading videos');
        const subSectionDetails = await SubSection.create({
            title: title,
            // timeDuration: timeDuration,
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

        const {subSectionId, sectionId} = req.body;
        const subSectionDetails = await SubSection.findById(subSectionId);
        if(!subSectionDetails){
            return returnResponse(res,404,false,"Subsection not found");
        }
        const deletedVideo = deleteVideo(subSectionDetails.publicId);
        const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);

        const updateSection = await Section.findByIdAndUpdate({_id: sectionId},{
            $pull: {
                subSection: subSectionId
            }
        }, {new: true});

        return returnResponse(res,200,true,"SubSection deleted successfully", updateSection);


    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in deleting subsection");
    }
}

export const updateSubSection = async (req,res) => {
    try{

        const {subSectionId,title, description} = req.body;  
        const videoFile = req?.files?.videoFile;
        if(!subSectionId && !title && !videoFile && !description){
            return returnResponse(res,200,true,"Nothing to update. Update successfull");
        }
        const subSectionDetails = await SubSection.findById(subSectionId);
        if(videoFile){
            const deletedVideo = await  deleteVideo(subSectionDetails.publicId);
            const uploaDetails = await uploadImage(videoFile,process.env.COURSES_VIDEOS_FOLDER);
            const newVideoUrl =  uploaDetails.secure_url; 
            subSectionDetails.videoUrl = newVideoUrl;
        }
        if(title){
            subSectionDetails.title = title;
        }
        if(description){
            subSectionDetails.description = description;
        }
        
        await subSectionDetails.save(); 
        console.log('updated lecture', subSectionDetails);

        return returnResponse(res,200,true,"Updated sub section successfully", subSectionDetails);
        
    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in updating subsection");
    }
}
