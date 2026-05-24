import { credentials } from "@grpc/grpc-js";
import { userServiceGrpc } from "../../../shared/src";
import config from "../config";

const userServiceClient = new userServiceGrpc.UserServiceClient(
  config.USER_SERVICE_GRPC_ADDRESS!,
  credentials.createInsecure(),
);

export { userServiceClient };
