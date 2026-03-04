import mongoose from "mongoose";
import { dbConnect } from "@/server/lib/db";
import { UserModel, type IUser, type UserResponse } from "@/server/models/User.model";

const USER_PUBLIC_FIELDS = "companyId email name role isActive createdAt";

export const userRepository = {
  async findById(id: string): Promise<UserResponse | null> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await UserModel.findById(id).select(USER_PUBLIC_FIELDS);
    if (!doc) return null;
    return doc.toJSON() as unknown as UserResponse;
  },

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    await dbConnect();
    return UserModel.findOne({ email: email.toLowerCase() })
      .select("+password +refreshToken")
      .lean<IUser | null>();
  },

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await UserModel.findByIdAndUpdate(id, { $set: { refreshToken } }).lean();
  },
};

