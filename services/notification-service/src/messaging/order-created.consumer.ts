import { orderMessaging, type OrderCreatedMessage } from "../../../shared/src";
import { Channel, ConsumeMessage } from "amqplib";

function consumeOrderCreatedMessages(channel: Channel) {
  try {
    const exchangeName = orderMessaging.ORDER_EXCHANGE;
    const routingKey = orderMessaging.OrderRoutingKeys.ORDER_CREATED;
    const queueName = orderMessaging.OrderQueues.ORDER_CREATED_NOTIFICATION_QUEUE;

    channel.assertExchange(exchangeName, "direct", { durable: true });
    channel.assertQueue(queueName, { durable: true, autoDelete: false });
    channel.bindQueue(queueName, exchangeName, routingKey);

    channel.consume(queueName, (message: ConsumeMessage | null) => {
      if (!message || !message.content) {
        console.error("Received an empty message or message without content");
        return;
      }

      const orderCreatedMessage = JSON.parse(message.content.toString()) as OrderCreatedMessage;

      console.log("Received order created message:", orderCreatedMessage);

      channel.ack(message);
    });
  } catch (error) {
    console.error(`Failed to consume order created messages: ${error}`);
    throw error;
  }
}

export { consumeOrderCreatedMessages };
