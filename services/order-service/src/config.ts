import dotenv from "dotenv";

dotenv.config();

class Config {
  public GRPC_HOST: string | undefined;
  public GRPC_PORT: number | undefined;
  public MONGO_URI: string | undefined;
  public RABBITMQ_URL: string | undefined;

  constructor() {
    this.GRPC_HOST = process.env.GRPC_HOST;
    this.GRPC_PORT = Number(process.env.GRPC_PORT);
    this.MONGO_URI = process.env.MONGO_URI;
    this.RABBITMQ_URL = process.env.RABBITMQ_URL;
  }
}

const config = new Config();

export default config;