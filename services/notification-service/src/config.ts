import dotenv from "dotenv";

dotenv.config();

class Config {
  public RABBITMQ_URL: string | undefined;

  constructor() {
    this.RABBITMQ_URL = process.env.RABBITMQ_URL;
  }
}

const config = new Config();

export default config;