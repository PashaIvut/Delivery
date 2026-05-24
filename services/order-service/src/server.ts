import * as grpc from "@grpc/grpc-js";
import mongoose from "mongoose";
import config from "./config";
import connectDB from "./db/connection";
import { orderService } from "./grpc/order-service";
import { orderServiceGrpc } from "../../shared/src";
import { connectToRabbitMQ } from "./messaging/connection";
import type { ChannelModel } from "amqplib";

const grpcServer = new grpc.Server();

let rabbitMQConnection: ChannelModel;

function setupGrpcServer(): void {
  grpcServer.addService(orderServiceGrpc.OrderServiceService, {
    createOrder: orderService.createOrder.bind(orderService),
    getOrderById: orderService.getOrderById.bind(orderService),
    getOrdersByUser: orderService.getOrdersByUser.bind(orderService),
    updateOrderStatus: orderService.updateOrderStatus.bind(orderService),
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

  if (!config.RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL must be defined in the environment variables");
  }

  await connectDB(config.MONGO_URI);

  const { connection, channel } = await connectToRabbitMQ();
  rabbitMQConnection = connection;
  orderService.setRabbitMQChannel(channel);

  setupGrpcServer();
}

initialize().catch((error) => {
  console.error("Failed to initialize order service:", error);
  process.exit(1);
});

async function shutdown() {
  console.log("Shutting down order service...");
  await mongoose.disconnect();

  if (rabbitMQConnection) {
    await rabbitMQConnection.close();
  }

  await new Promise<void>((resolve) => {
    grpcServer.tryShutdown(() => {
      console.log("gRPC server shut down gracefully");
      resolve();
    });
  });

  console.log("Order service has been shut down gracefully.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
