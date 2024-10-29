import mongoose, { Schema } from "mongoose";

const subscriptionsSchema = new Schema({
  subscriber: {
    type: Schema.type.ObjectId,
    ref: "User",
  },
  channel: {
    type: Schema.type.ObjectId,
    ref: "User",
  },
});

export const Subscription = mongoose.model("Subscription", subscriptionsSchema);
