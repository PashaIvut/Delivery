import dotenv from "dotenv";

dotenv.config();

class Config {
  public GRPC_HOST: string | undefined;
  public GRPC_PORT: number | undefined;
  public JWT_SECRET: string | undefined;
  public JWT_EXPIRATION: string | undefined;
  public MONGO_URI: string | undefined;
  public USER_SERVICE_GRPC_ADDRESS: string | undefined;

  constructor() {
    this.GRPC_HOST = process.env.GRPC_HOST;
    this.GRPC_PORT = Number(process.env.GRPC_PORT);
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.JWT_EXPIRATION = process.env.JWT_EXPIRATION;
    this.MONGO_URI = process.env.MONGO_URI;
    this.USER_SERVICE_GRPC_ADDRESS = process.env.USER_SERVICE_GRPC_ADDRESS;
  }
}

const config = new Config();

export default config;