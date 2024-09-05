import { v2 as cdl } from "cloudinary";
import fs from "fs";

cdl.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadcloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    const response = await cdl.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File is Uploaded", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
  }
};

const uploadResult = await cloudinary.uploader.upload(
  "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
  {
    public_id: "shoes",
  }
);
