// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
// import mongoose from "mongoose";
// import { Db_Name } from "./constants";
import connectDb from "./db/db.js";

dotenv.config({
  path: "./env",
});
connectDb();

// import express from "express";

// const app = express();

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URl}/${Db_Name}`);
//     app.on("error", (error) => {
//       console.log("Error: ", error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`App is Listening on Port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log("Error: ", error);
//     throw err;
//   }
// })();
