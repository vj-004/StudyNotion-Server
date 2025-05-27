import User from "../models/User.js";
import { mailSender } from "../utils/mailSender.js";
import { returnResponse } from "../utils/specialUtils.js";

export const contactUs = async (req,res) => {
    try{    

        const {firstName,lastName,email,phoneNumber,message} = req.body;

        if(!firstName || !lastName || !email  || !message){
            return returnResponse(res,400,false,"Please enter all fields provided");
        }

        const studentMailResponse = await mailSender(email,"StudyNotion is at your service",
            "Thank you for contacting us at StudyNotion, you message has been recieved and will be dealt with as soon as possible");

        console.log(studentMailResponse);

        const studyNotionMailResponse = await mailSender(process.env.MAIL_USER,"Contact us form recieved from user",{
            firstName,
            lastName,
            email,
            phoneNumber,
            message
        });

        console.log(studyNotionMailResponse);

        return returnResponse(res,200,true,"Your feedback has been recieved, we will get back to you soon");

    }catch(error){
        console.log(error);
        return returnResponse(res,500,false,"Error in contactUs form");
    }
}