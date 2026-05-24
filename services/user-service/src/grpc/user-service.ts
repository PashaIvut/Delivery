import * as grpc from "@grpc/grpc-js";
import { userServiceGrpc } from "../../../shared/src";
import User from "../models/user.model";

class UserService {
  public async createUser(
    call: grpc.ServerUnaryCall<userServiceGrpc.CreateUserRequest, userServiceGrpc.CreateUserResponse>,
    callback: grpc.sendUnaryData<userServiceGrpc.CreateUserResponse>,
  ) {
    const { nickname, email } = call.request;

    if (!nickname || !email) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Nickname and email are required",
      });
    }

    try {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: "User with this email already exists",
        });
      }

      const user = await User.create({ nickname, email });

      return callback(null, {
        user: this.mapUser(user),
      });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to create user",
      });
    }
  }

  public async getUserById(
    call: grpc.ServerUnaryCall<userServiceGrpc.GetUserByIdRequest, userServiceGrpc.GetUserByIdResponse>,
    callback: grpc.sendUnaryData<userServiceGrpc.GetUserByIdResponse>,
  ) {
    const { userId } = call.request;

    if (!userId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "User ID is required",
      });
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "User not found",
        });
      }

      return callback(null, {
        user: this.mapUser(user),
      });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to get user",
      });
    }
  }

  public async getUserProfile(
    call: grpc.ServerUnaryCall<userServiceGrpc.GetUserProfileRequest, userServiceGrpc.GetUserProfileResponse>,
    callback: grpc.sendUnaryData<userServiceGrpc.GetUserProfileResponse>,
  ) {
    const { userId } = call.request;

    if (!userId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "User ID is required",
      });
    }

    try {
      const user = await User.findById(userId);

      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "User not found",
        });
      }

      return callback(null, {
        user: this.mapUser(user),
      });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to get user profile",
      });
    }
  }

  public async updateUserProfile(
    call: grpc.ServerUnaryCall<userServiceGrpc.UpdateUserProfileRequest, userServiceGrpc.UpdateUserProfileResponse>,
    callback: grpc.sendUnaryData<userServiceGrpc.UpdateUserProfileResponse>,
  ) {
    const { userId, nickname, email } = call.request;

    if (!userId || !nickname || !email) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "User ID, nickname and email are required",
      });
    }

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { nickname, email },
        { new: true, runValidators: true },
      );

      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "User not found",
        });
      }

      return callback(null, {
        user: this.mapUser(user),
      });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to update user profile",
      });
    }
  }

  private mapUser(user: { id: string; nickname: string; email: string }): userServiceGrpc.UserMessage {
    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    };
  }
}

export const userService = new UserService();