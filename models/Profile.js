import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
    gender:{
        type: String,
    },
    dateOfBirth:{
        type: String,
    },
    about:{
        type: String,
        trim: true,
    },
    contactNumber:{
        type: Number,
        trim: true
    },
});

const Profile = mongoose.model("Profile",ProfileSchema);
export default Profile;