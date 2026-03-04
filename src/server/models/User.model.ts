/** Mongoose User schema and model; timestamps, toJSON transform (id, no password), indexes. */

import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  email: string;
  name: string;
  password: string;
  role: "admin" | "member";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  refreshToken?: string | null;
}

export interface UserResponse {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: "admin" | "member";
  isActive: boolean;
  createdAt: string;
}

const userSchema = new Schema<IUser>(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        const out: UserResponse = {
          id: String(ret._id),
          companyId: String(ret.companyId),
          email: String(ret.email),
          name: String(ret.name),
          role: ret.role === "admin" ? "admin" : "member",
          isActive: Boolean(ret.isActive),
          createdAt:
            ret.createdAt instanceof Date
              ? ret.createdAt.toISOString()
              : typeof ret.createdAt === "string"
                ? ret.createdAt
                : new Date().toISOString(),
        };
        delete ret.password;
        delete ret.refreshToken;
        return out;
      },
    },
  },
);

userSchema.index({ companyId: 1, email: 1 }, { unique: true });

export const UserModel: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
