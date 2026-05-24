import config from "./config";
import { consumeOrderCancelledMessages } from "./messaging/order-cancelled.consumer";
import { connectToRabbitMQ } from "./messaging/connection";
import { consumeOrderConfirmedMessages } from "./messaging/order-confirmed.consumer";
import { consumeOrderCreatedMessages } from "./messaging/order-created.consumer";
import type { ChannelModel } from "amqplib";

let rabbitMQConnection: ChannelModel;

async function initialize() {
  if (!config.RABBITMQ_URL) {
    throw new Error("RABBITMQ_URL must be defined in the environment variables");
  }

  const { connection, channel } = await connectToRabbitMQ();
  rabbitMQConnection = connection;
  consumeOrderCancelledMessages(channel);
  consumeOrderConfirmedMessages(channel);
  consumeOrderCreatedMessages(channel);
}

initialize().catch((error) => {
  console.error("Failed to initialize notification service:", error);
  process.exit(1);
});

async function shutdown() {
  console.log("Shutting down notification service...");

  if (rabbitMQConnection) {
    await rabbitMQConnection.close();
  }

  console.log("Notification service has been shut down.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
