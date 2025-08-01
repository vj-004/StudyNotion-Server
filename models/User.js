import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        firstName:{
            type: String,
            required: true,
            trim: true
        },
        lastName:{
            type: String,
            required: true,
            trim: true
        },
        email:{
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        password:{
            type: String,
            required: true,
        },
        accountType:{
            type: String,
            enum: ["admin","student","instructor"],
            required: true,
        },
        additionalDetails:{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Profile"
        },
        courses:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref:"Course",
            }
        ],
        image:{
            type: String,
            required: true,
        },
        courseProgress:[
            {
                courseId:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref:"CourseProgress",
                },
                progressPercentage: {
                    type: Number,
                    required: true,
                    default: 0,
                }
            }
        ],
        token:{
            type: String,
        },
        resetPasswordExpires:{
            type:Date
        },
    }
);

const User = mongoose.model("User", UserSchema);
export default User;