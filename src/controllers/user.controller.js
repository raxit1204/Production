import { asynchandler } from "../utils/async_handlers.js";
import { ApiError } from "../utils/api_errors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/api_response.js";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";

const generateAccessTokenandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went Wrong");
  }
};

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

  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const exsisted_user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (exsisted_user) {
    throw new ApiError(409, "User already exsist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverIamgeLocalPath = req.file?.coverImage[0]?.path;

  let coverIamgeLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverIamgeLocalPath.length > 0
  ) {
    coverIamgeLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Required!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverIamgeLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is Required!");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registers Successfully..."));
});

const loginUser = asynchandler(async (req, res) => {
  // req body -> Data
  // username, email
  // find User
  // check password
  //access and refresh token
  // send cookies
  // send Response

  const { email, username, password } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "Username or email required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exsist!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password incorrect");
  }
  const { accessToken, refreshToken } =
    await generateAccessTokenandRefreshTokens(user._id);

  const loggedInUser = User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .jon(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn Successfully"
      )
    );
});
const logOutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .staus(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

export { registerUser, loginUser, logOutUser };
