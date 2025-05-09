import { hash } from "bcrypt";
import User from "../models/User.js";
import { mailSender } from "../utils/mailSender.js";
import { returnResponse } from "../utils/specialUtils.js";

export const resetPasswordToken =  async (req,res) => {

    try{
        const {email} = req.body;
        const user = User.findOne({email: email});
        if(!user){
            return returnResponse(res,403,false,"User does not exist");
        }
        const token = crypto.randomUUID();
        const updatedDetails = await User.findOneAndUpdate(
            {email: email},
            {token: token, resetPasswordExpires:Date.now()+(5*60*1000)},
            {new: true}
        );
        //console.log('token: ', token);
        const url = `http://localhost:3000/update-password/${token}`; // assuming frontend is hosted on port 3000.
        const mailResponse = await  mailSender(email,"StudyNotion - Password Reset",`Use this link to reset your password. Reset link: ${url}`);
        return returnResponse(res,200,true,"Email sent successfully, Please check email and change password. Window to change password is 5 minutes");
    
    } catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in creating resetPassword token");
    
    }
}

export const resetPassword = async (req,res) => {
    try{

        const {token,password,confirmPassword} = req.body;
        if(password!=confirmPassword) return returnResponse(res,400,false,"Password and Confirm Password are not the same");

        const userDetails = await User.findOne({token: token});
        if(!userDetails){
            return returnResponse(403,false,"Token is invalid");
        }

        if(userDetails.resetPasswordExpires < Date.now()){
            return returnResponse(res,401,false,"Reset password link has expired, please request for new link");
        }

        const hashedPassword = await hash(password,10);
        await User.findOneAndUpdate(
            {token: token},
            {password: hashedPassword},
            {new: true}
        );

        return returnResponse(res,200,true,"Password reset successfull");

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in ressetting password");
    }

}
