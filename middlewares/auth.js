import jwt from "jsonwebtoken";
import { returnResponse } from "../utils/specialUtils.js"

const auth = async (req,res,next) => {
    try{

        const token = req.cookies?.token || 
        req.body?.token || 
        req.header("Authorization").replace("Bearer ","");


        if(!token){
            return returnResponse(res,401,false,"Token is missing");
        }

        try{

            const decode = jwt.verify(token,process.env.JWT_SECRET);
            req.user = decode;
            
        }catch(error){
            return returnResponse(res,401,false,"token is invalid");
        }

        next();

    }catch(error){
        return returnResponse(res,500,false,"You are unauthenticated, Please login first");
    }
}

export const isStudent = async (req,res,next) => {
    try{
        if(req.user.accountType !== "student"){
            return returnResponse(res,401,false,"This is a protected route for students only");
        }
        next();
    }catch(error){
        return returnResponse(res,500,false,"User role cannot be verified");
    }
}

export const isAdmin = async (req,res,next) => {
    try{
        if(req.user.accountType !== "admin"){
            return returnResponse(res,401,false,"This is a protected route for admins only");
        }
        next(); 
    }catch(error){
        return returnResponse(res,500,false,"User role cannot be verified");
    }
}

export const isInstructor = async (req,res,next) => {
    try{
        if(req.user.accountType !== "instructor"){
            return returnResponse(res,401,false,"This is a protected route for instructors only");
        }
        next(); 
    }catch(error){
        return returnResponse(res,500,false,"User role cannot be verified");
    }
}

export default auth;