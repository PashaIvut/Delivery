import { orderMessaging, type OrderCreatedMessage } from "../../../shared/src";
import { Channel } from 'amqplib';

function produceOrderCreatedMessage(channel: Channel, message: OrderCreatedMessage) {
  try {
    const exchangeName = orderMessaging.ORDER_EXCHANGE;
    const routingKey = orderMessaging.OrderRoutingKeys.ORDER_CREATED;

    console.log(`Producing order created message: ${message.orderId}, (${message.userId})`);

    const messageBuffer = Buffer.from(JSON.stringify(message));

    channel.assertExchange(exchangeName, 'direct', { durable: true });

    channel.publish(exchangeName, routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json'
    });
  } catch (error) {
    console.error(`Failed to produce order created message: ${error}`);
  }
}

export { produceOrderCreatedMessage };
