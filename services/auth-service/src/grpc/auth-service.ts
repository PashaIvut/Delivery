import * as grpc from "@grpc/grpc-js";
import { authServiceGrpc, userServiceGrpc } from "../../../shared/src";
import config from "../config";
import Auth from "../models/auth.model";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { userServiceClient } from "./user-service-client";

class AuthService {
  public async register(
    call: grpc.ServerUnaryCall<authServiceGrpc.RegisterRequest, authServiceGrpc.RegisterResponse>,
    callback: grpc.sendUnaryData<authServiceGrpc.RegisterResponse>,
  ) {
    const { nickname, email, password } = call.request;

    if (!nickname || !email || !password) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Nickname, email and password are required",
      });
    }

    if (!config.JWT_SECRET) {
      return callback({
        code: grpc.status.INTERNAL,
        message: "JWT_SECRET is not configured",
      });
    }

    try {
      const existingAuth = await Auth.findOne({ email });

      if (existingAuth) {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: "User with this email already exists",
        });
      }

      const createUserResponse = await new Promise<userServiceGrpc.CreateUserResponse>((resolve, reject) => {
        userServiceClient.createUser({ nickname, email }, (err, response) => {
          if (err) {
            return reject(err);
          }

          return resolve(response);
        });
      });

      if (!createUserResponse.user) {
        return callback({
          code: grpc.status.INTERNAL,
          message: "Failed to create user profile",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const auth = await Auth.create({
        userId: createUserResponse.user.id,
        email,
        passwordHash,
      });

      const accessToken = this.generateToken(auth.userId);

      return callback(null, { accessToken });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to register user",
      });
    }
  }

  public async login(
    call: grpc.ServerUnaryCall<authServiceGrpc.LoginRequest, authServiceGrpc.LoginResponse>,
    callback: grpc.sendUnaryData<authServiceGrpc.LoginResponse>,
  ) {
    const { email, password } = call.request;

    if (!email || !password) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Email and password are required",
      });
    }

    if (!config.JWT_SECRET) {
      return callback({
        code: grpc.status.INTERNAL,
        message: "JWT_SECRET is not configured",
      });
    }

    try {
      const auth = await Auth.findOne({ email });

      if (!auth) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "User not found",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, auth.passwordHash);

      if (!isPasswordValid) {
        return callback({
          code: grpc.status.UNAUTHENTICATED,
          message: "Invalid password",
        });
      }

      const accessToken = this.generateToken(auth.userId);

      return callback(null, { accessToken });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to login user",
      });
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      config.JWT_SECRET as string,
      {
        expiresIn: (config.JWT_EXPIRATION as SignOptions["expiresIn"]) || "1h",
      },
    );
  }
}

export const authService = new AuthService();