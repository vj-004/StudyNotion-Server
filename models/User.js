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
            trim: true
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
                type: mongoose.Schema.Types.ObjectId,
                ref:"CourseProgress",
            }
        ],
    }
);

const User = mongoose.model("User", UserSchema);
export default User;