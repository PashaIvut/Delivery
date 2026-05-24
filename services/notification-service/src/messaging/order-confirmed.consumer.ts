import { Channel, ConsumeMessage } from "amqplib";
import { orderMessaging, type OrderConfirmedMessage } from "../../../shared/src";

function consumeOrderConfirmedMessages(channel: Channel): void {
  try {
    const exchangeName = orderMessaging.ORDER_EXCHANGE;
    const routingKey = orderMessaging.OrderRoutingKeys.ORDER_CONFIRMED;
    const queueName = orderMessaging.OrderQueues.ORDER_CONFIRMED_NOTIFICATION_QUEUE;

    channel.assertExchange(exchangeName, "direct", { durable: true });
    channel.assertQueue(queueName, { durable: true, autoDelete: false });
    channel.bindQueue(queueName, exchangeName, routingKey);

    channel.consume(queueName, (message: ConsumeMessage | null) => {
      if (!message || !message.content) {
        console.error("Received an empty message or message without content");
        return;
      }

      const orderConfirmedMessage = JSON.parse(message.content.toString()) as OrderConfirmedMessage;

      console.log("Received order confirmed message:", orderConfirmedMessage);

      channel.ack(message);
    });
  } catch (error) {
    console.error(`Failed to consume order confirmed messages: ${error}`);
    throw error;
  }
}

export { consumeOrderConfirmedMessages };
