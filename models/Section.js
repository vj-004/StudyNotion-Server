import mongoose, { mongo } from "mongoose";

const SectionSchema = new mongoose.Schema({

    sectionName:{
        type:String,
    },
    subSection:[{
        type:mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "SubSection"
    }]

});

const Section = mongoose.model("Section",SectionSchema);
export default Section;