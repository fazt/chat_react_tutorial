import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chat_react_tutorial";

export const connectDB = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGODB_URI);
  console.log(`mongo connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};
