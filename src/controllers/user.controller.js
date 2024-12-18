import { asynchandler } from "../utils/async_handlers.js";
import { ApiError } from "../utils/api_errors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/api_response.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
  console.log(email);

  if (!username && !email) {
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

  const loggedInUser = await User.findById(user._id).select(
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
    .json(
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
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asynchandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorize Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw ApiError(401, "refresh token is expired or in use..");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessTokenandRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", newrefreshToken)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Refresh Token Error");
  }
});

const changeUserpassword = asynchandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;

  const User = await User.findById(req.user?._id);
  const isPasswordcorrect = await User.isPasswordCorrect(oldpassword);

  if (!isPasswordcorrect) {
    throw new ApiError(401, "Invalid Password");
  }

  User.password = newpassword;
  await User.save({ validateBeforeSave: false });

  return res.status(200).json(200, {}, "Password Changed Successfully");
});

const getCurrentUser = asynchandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current user fetched..");
});

const updateAccountDetails = asynchandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields required");
  }

  const User = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, User, "Account details updated"));
});

const updateUserAvatar = asynchandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  //TODO: delete old image - assignment

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asynchandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  //TODO: delete old image - assignment

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on CoverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeUserpassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
