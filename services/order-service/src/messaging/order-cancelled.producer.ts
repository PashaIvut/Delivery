import { Channel } from "amqplib";
import { orderMessaging, type OrderCancelledMessage } from "../../../shared/src";

function produceOrderCancelledMessage(channel: Channel, message: OrderCancelledMessage): void {
  try {
    const exchangeName = orderMessaging.ORDER_EXCHANGE;
    const routingKey = orderMessaging.OrderRoutingKeys.ORDER_CANCELLED;

    console.log(`Producing order cancelled message: ${message.orderId}, (${message.userId})`);

    const messageBuffer = Buffer.from(JSON.stringify(message));

    channel.assertExchange(exchangeName, "direct", { durable: true });

    channel.publish(exchangeName, routingKey, messageBuffer, {
      persistent: true,
      contentType: "application/json",
    });
  } catch (error) {
    console.error(`Failed to produce order cancelled message: ${error}`);
  }
}

export { produceOrderCancelledMessage };
