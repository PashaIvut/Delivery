import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "../interfaces/user.interface";

interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    nickname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model<IUserDocument>("User", UserSchema);

export default User;
