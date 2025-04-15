import { generate } from "otp-generator";
import User from "../models/User";
import OTP from "../models/Otp";
import { returnResponse } from "../utils/specialUtils";
import { compare, hash } from "bcrypt";
import Profile from "../models/Profile";
import { sign } from "jsonwebtoken";

export const sendOtp = async (req,res) => {
    
    try{
        const {email} = req.body;
        const checkUserPresent = await User.findOne({email});
        if(checkUserPresent){
            return res.status(401).json({
                success: false,
                message: "User already exists"
            });
        }

        //generate otp
        var otp = generate(6,{
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        console.log('Otp generated: ', otp);

        //check unique otp
        //bad way to check ofr unique otp
        let result = await OTP.findOne({otp: otp});

        while(result){
            otp = generate(6,{
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            result = await OTP.findOne({otp: otp});
        }

        const otpPayload = {email,otp};
        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        })


    }catch(error){

        console.log(error);
        console.log('error in sending otp');

    }
}

export const signUp = async (req,res) => {

    try{

        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp ){
            return res.status(403).json({
                success: false,
                message: "All fields are required"
            });
        }

        if(password !== confirmPassword){
            return returnResponse(res,400,false,"password and confirm password don't match");
        }

        const existingUser = User.findOne({email});
        if(existingUser){
            return returnResponse(res,400,false,"User is already registered");
        }

        const recentOtp = await OTP.findOne({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);

        if(recentOtp.length == 0){
            return returnResponse(res,400,false,"OTP not found");
        }
        if(otp !== recentOtp){
            return returnResponse(res,400,false,"Invalid OTP");
        }

        const hashedPassword = await hash(password,10);

        const profileDeatils = await Profile.create({
            gender: null,
            DOB: null,
            contactNumber,
            about: null
        });

        const user = User.create({
            firstName,
            lastName,
            email,
            hashedPassword,
            accountType,
            additionalDetails: profileDeatils._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        });

        return returnResponse(res,200,true,"User created successfully");


    }catch(error){
        return returnResponse(res,500,false,"Error creating User, Please try again");
    }

}

export const login = async(req,res) => {
    try{

        const {email,password} = req.body;
        if(!email || !password){
            return returnResponse(res,403,false,"All fields are required, Please try again");
        }
        const user = User.findOne({email});

        if(!user){
            return returnResponse(res,401,false,"User does not exist, Please Sign Up");
        }

        if(await compare(password,user.password)){
            const payload = {
                email: user.email,
                id: user._id,
                role: user.accountType,
            }
            const token = sign(payload, JWT_SECRET,{
                expiresIn:"2h"
            });
            user = user.toObject();
            user.token = token;
            user.password = undefined;
            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "Loggin successfull"
            });
        }
        else{
            return returnResponse(res,401,false,"Password is incorrect");
        }


    }catch(error){
        return returnResponse(res,500,false,"Error logging in, Please try again");
    }
}

export const changePassword = async (req,res) => {
    try{

        // change password and forgot password are slightly different, this is change password
        const {email,oldPassword,newPassword,confirmNewPassword} = req.body;
        
        if(!oldPassword || !newPassword || !confirmNewPassword){
            return returnResponse(res,403,false,"All fields required while changing password");
        }
        if(newPassword !== confirmNewPassword){
            return returnResponse(res,401,false,"New password does not match confirmed new password");
        }

        const hashedPassword = hash(newPassword);

        const user = await User.findOneAndUpdate(
            {email},
            {password: hashedPassword},
            {new:true}
        );

        console.log("User after changing password",user);

        const mailResponse = mailSender(email,'Password Changed Successfully',"");

        console.log(mailResponse);

        return returnResponse(res,200,true,"Passowrd Changed Successfully");

    }catch(error){

    }
}