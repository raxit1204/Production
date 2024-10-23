import { async_handler } from "../utils/async_handlers.js";
import { Api_Error } from "../utils/api_errors.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = async_handler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    if (!token) {
      throw new Api_Error(401, "Unauthorize request!");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_Token_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new Api_Error(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new Api_Error(401, "Invalid Access!");
  }
});
