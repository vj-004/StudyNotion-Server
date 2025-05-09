
import Category from "../models/Category.js";
import { returnResponse } from "../utils/specialUtils.js"
//create category handler function
export const createCategory = async (req,res) => {
    try{

        const {name,description} = req.body;
        if(!name || !description){
            return returnResponse(res,400,false,"All fields are required");
        }

        const categoryDetails = await Category.create({
            name: name,
            description: description
        });

        return returnResponse(res,200,true,"category created successfully",categoryDetails);

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in creating category");
    }
}
//getting all categories
export const showAllCategories = async (req,res) => {
    try{

        const allCategories = await Category.find({},{name:true, description: true});
        return res.status(200).json({
            success: true,
            message: "All categories returned successfully",
            allCategories,
        });

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in showing all categories");
    }
}

//need to complete
export const categoryPageDetails = async (req,res) => {

    try{    

        const {categoryId} = req.body;

        const selectedCategory = await Category.findById(categoryId)
        .populate("courses").exec();

        if(!selectedCategory){
            return returnResponse(res,404,false,"Courses not found under this category");
        }

        if (selectedCategory.courses.length === 0) {
			console.log("No courses found for the selected category.");
			return res.status(404).json({
				success: false,
				message: "No courses found for the selected category.",
			});
		}

        const differentCategories = await Category.find({
            _id: {$ne: categoryId}
        })
        .populate("courses").exec();


        //get the top 10 selling courses


        return returnResponse(res,200,true,"Category page details fetched successfully",{
            selectedCategory,
            differentCategories,
        });

    }catch(error){
        console.log(error);
    }
}