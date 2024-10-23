// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
// import mongoose from "mongoose";
// import { Db_Name } from "./constants";
import connectDb from "./db/db.js";
import { portconfig } from "./constants.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDb()
  .then(() => {
    app.listen(portconfig, () => {
      console.log(`Server is Running at Port ${portconfig}`);
    });
  })
  .catch((err) => {
    console.log("Connection Error(Database)", err);
  });

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
