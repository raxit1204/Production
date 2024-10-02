import { asynchandler } from "../utils/async_handlers.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";

const registerUser = asynchandler(async (req, res) => {
  //get user details from frontend
  //validation
  //check if user already exsist: username, email
  //check for images: avtar
  //upload them to cloudinary
  //create user object- create entry in db
  //remove password and refresh token field from response
  // check user creation
  //return res

  const { fullname, email, username, password } = req.body;
  console.log("email: ", email);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const exsisted_user = User.findOne({
    $or: [{ username }, { email }],
  });

  if (exsisted_user) {
    throw new ApiError(409, "User already exsist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverIamgeLocalPath = req.file?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Required!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverIamgeLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is Required!");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = user.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registers Successfully"));
});

export { registerUser };
