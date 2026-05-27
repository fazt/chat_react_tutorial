import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    usuario: { type: String, required: true, trim: true, maxlength: 60 },
    texto: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export const Message = model("Message", messageSchema);
