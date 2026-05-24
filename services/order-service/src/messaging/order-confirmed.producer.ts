import { Channel } from "amqplib";
import { orderMessaging, type OrderConfirmedMessage } from "../../../shared/src";

function produceOrderConfirmedMessage(channel: Channel, message: OrderConfirmedMessage): void {
  try {
    const exchangeName = orderMessaging.ORDER_EXCHANGE;
    const routingKey = orderMessaging.OrderRoutingKeys.ORDER_CONFIRMED;

    console.log(`Producing order confirmed message: ${message.orderId}, (${message.userId})`);

    const messageBuffer = Buffer.from(JSON.stringify(message));

    channel.assertExchange(exchangeName, "direct", { durable: true });

    channel.publish(exchangeName, routingKey, messageBuffer, {
      persistent: true,
      contentType: "application/json",
    });
  } catch (error) {
    console.error(`Failed to produce order confirmed message: ${error}`);
  }
}

export { produceOrderConfirmedMessage };
