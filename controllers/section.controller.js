import Course from "../models/Course.js";
import Section from "../models/Section.js";
import SubSection from "../models/SubSection.js";
import { returnResponse } from "../utils/specialUtils.js";

export const createSection = async (req,res) => {

    try{

        const {sectionName,courseId} = req.body;
        if(!sectionName || !courseId){
            return returnResponse(res,400,false,"Please enter section name and correct courseId");
        }
        const newSection = await Section.create({
            sectionName,
        });

        const updatedCourse = await Course.findByIdAndUpdate(courseId,{$push:{courseContent: newSection._id}},{new: true});

        if(!updatedCourse){
            return returnResponse(res,404,false,"Course not found");
        }

        console.log(updatedCourse);
        return returnResponse(res,200,true,"Section created and Course updated successfully", newSection);

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in creating a section")
    }

}

export const updateSection = async (req,res) => {

    try{

        const {sectionId,sectionName} = req.body;

        if(!sectionId || !sectionName){
            return returnResponse(res,400,false,"Please select a section and new section name");
        }

        const updatedSection = await Section.findByIdAndUpdate(sectionId,{
            sectionName: sectionName
        },{new: true});

        if(!updatedSection){
            return returnResponse(res,404,false,"Section not found");
        }

        return res.status(200).json({
            success: true,
            message: "Section updated successfully",
            updatedSection,
        });

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in updating a section")
    }

}

export const deleteSection = async (req,res) => {

    try{
        //const {sectionId} = req.params;
        const {sectionId,courseId} = req.body;
        if(!sectionId || !courseId){
            return returnResponse(res,400,false,"Please select a section and correct courseId");
        }
        //delete sectionId in course
        const updatedCourse = await Course.findByIdAndUpdate({_id: courseId},{$pull:{courseContent: sectionId}},{new: true}); 
        if(!updatedCourse){
            return returnResponse(res,404,false,"Course not found");
        }
        const deletedSection = await Section.findByIdAndDelete(sectionId);
        for(let subSectionId in deleteSection.subSection){
            const subSectionDeleted = await SubSection.findByIdAndDelete(subSectionId);
        }

        console.log('Deleted section', deletedSection);
        return returnResponse(res,200,true,"Deleted Section Successfully");

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in deleting a section")
    }

}