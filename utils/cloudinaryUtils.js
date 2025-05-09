import { v2 as cloudinary } from "cloudinary"

export const uploadImage = async (file,folder,height,quality) => {
    
    const options = {folder};
    if(height) options.height = height;
    if(quality) options.quality = quality;

    options.resource_type = "auto";

    return await cloudinary.uploader.upload(file.tempFilePath,options);

}

export const deleteImage = async (publicId) => {

    const options = {
        resource_type: "image"
    };
    return await cloudinary.uploader.destroy(`${publicId}`,options);

}

export const deleteVideo = async (publicId) => {
    const options = {
        resource_type: "video"
    };
    return await cloudinary.uploader.destroy(`${publicId}`,options);
}

