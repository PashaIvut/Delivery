import { Channel, ConsumeMessage } from "amqplib";
import { orderMessaging, type OrderCancelledMessage } from "../../../shared/src";

function consumeOrderCancelledMessages(channel: Channel): void {
  try {
    const exchangeName = orderMessaging.ORDER_EXCHANGE;
    const routingKey = orderMessaging.OrderRoutingKeys.ORDER_CANCELLED;
    const queueName = orderMessaging.OrderQueues.ORDER_CANCELLED_NOTIFICATION_QUEUE;

    channel.assertExchange(exchangeName, "direct", { durable: true });
    channel.assertQueue(queueName, { durable: true, autoDelete: false });
    channel.bindQueue(queueName, exchangeName, routingKey);

    channel.consume(queueName, (message: ConsumeMessage | null) => {
      if (!message || !message.content) {
        console.error("Received an empty message or message without content");
        return;
      }

      const orderCancelledMessage = JSON.parse(message.content.toString()) as OrderCancelledMessage;

      console.log("Received order cancelled message:", orderCancelledMessage);

      channel.ack(message);
    });
  } catch (error) {
    console.error(`Failed to consume order cancelled messages: ${error}`);
    throw error;
  }
}

export { consumeOrderCancelledMessages };
