import * as grpc from "@grpc/grpc-js";
import mongoose from "mongoose";
import config from "./config";
import connectDB from "./db/connection";
import { userService } from "./grpc/user-service";
import { userServiceGrpc } from "../../shared/src";

const grpcServer = new grpc.Server();

function setupGrpcServer(): void {
  grpcServer.addService(userServiceGrpc.UserServiceService, {
    createUser: userService.createUser.bind(userService),
    getUserById: userService.getUserById.bind(userService),
    getUserProfile: userService.getUserProfile.bind(userService),
    updateUserProfile: userService.updateUserProfile.bind(userService),
  });

  const grpcHost = config.GRPC_HOST;
  const grpcPort = config.GRPC_PORT;

  if (!grpcHost || !grpcPort) {
    throw new Error("GRPC_HOST and GRPC_PORT must be defined in the environment variables");
  }

  const grpcAddress = `${grpcHost}:${grpcPort}`;

  grpcServer.bindAsync(grpcAddress, grpc.ServerCredentials.createInsecure(), (err, _port) => {
    if (err) {
      console.error(`Failed to bind gRPC server: ${err.message}`);
      throw err;
    }

    console.log(`gRPC server is running on ${grpcAddress}`);
  });
}

async function initialize() {
  if (!config.MONGO_URI) {
    throw new Error("MONGO_URI must be defined in the environment variables");
  }

  await connectDB(config.MONGO_URI);
  setupGrpcServer();
}

initialize().catch((error) => {
  console.error("Failed to initialize user service:", error);
  process.exit(1);
});

async function shutdown() {
  console.log("Shutting down user service...");
  await mongoose.disconnect();

  await new Promise<void>((resolve) => {
    grpcServer.tryShutdown(() => {
      console.log("gRPC server shut down gracefully");
      resolve();
    });
  });

  console.log("User service has been shut down gracefully.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
