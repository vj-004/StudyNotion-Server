import mongoose from "mongoose";
import { mailSender } from "../utils/mailSender.js";
import { otpTemplate } from "../mail/templates/emailVerificationTemplate.js";


const OtpSchema = new mongoose.Schema({

    email:{
        type: String,
        required: true,
    },
    otp:{
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 5*60
    },
});

const sendVerificationEmail = async (email,otp) => {
    try{
        const mailResponse = await mailSender(email,'Verification email from StudyNotion',otpTemplate(otp));
        console.log('Email sent successfully', mailResponse); 

    }catch(error){
        console.log('Error in sending verification email',error);
        throw error;
    }
}

OtpSchema.pre("save", async function (next) {
    await sendVerificationEmail(this.email,this.otp);
    next();
});

const OTP = mongoose.model("Otp", OtpSchema);
export default OTP;