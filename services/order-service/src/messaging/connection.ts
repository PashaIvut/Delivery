import config from '../config';
import amqplib from 'amqplib';

async function connectToRabbitMQ() {
  try {
    const connection = await amqplib.connect(config.RABBITMQ_URL!);
    const channel = await connection.createChannel();

    console.log('Connected to RabbitMQ successfully');

    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

export { connectToRabbitMQ };
