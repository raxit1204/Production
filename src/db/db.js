import mongoose from "mongoose";
import { Db_Name } from "../constants.js";

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${Db_Name}`
    );
    console.log(
      `\n MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB Connection Error", error);
    process.exit(1);
  }
};

export default connectDb;
