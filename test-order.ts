import { credentials } from "@grpc/grpc-js";
import jwt from "jsonwebtoken";
import { authServiceGrpc, orderServiceGrpc, userServiceGrpc } from "./services/shared/src";

const JWT_SECRET = "secret-key";

const authClient = new authServiceGrpc.AuthServiceClient(
  "localhost:50051",
  credentials.createInsecure(),
);

const userClient = new userServiceGrpc.UserServiceClient(
  "localhost:50052",
  credentials.createInsecure(),
);

const orderClient = new orderServiceGrpc.OrderServiceClient(
  "localhost:50053",
  credentials.createInsecure(),
);

function registerUser() {
  const specialName = Date.now();

  return new Promise<{ userId: string }>((resolve, reject) => {
    authClient.register(
      {
        nickname: `user-${specialName}`,
        email: `user-${specialName}@example.com`,
        password: "password123",
      },
      (err, response) => {
        if (err) return reject(err);
        if (!response?.accessToken) {
          return reject(new Error("Register: access token not found"));
        }

        const payload = jwt.verify(response.accessToken, JWT_SECRET) as { id?: string };

        if (!payload.id) {
          return reject(new Error("Register: user id not found in token"));
        }

        resolve({ userId: payload.id });
      },
    );
  });
}

function getUserProfile(userId: string) {
  return new Promise<userServiceGrpc.GetUserProfileResponse>((resolve, reject) => {
    userClient.getUserProfile({ userId }, (err, response) => {
      if (err) 
        return reject(err);
      if (!response) 
        return reject(new Error("GetUserProfile: empty response"));
      resolve(response);
    });
  });
}

function createOrder(userId: string) {
  return new Promise<orderServiceGrpc.CreateOrderResponse>((resolve, reject) => {
    orderClient.createOrder(
      {
        userId,
        items: [
          {
            productId: "product-1",
            name: "product-1",
            quantity: 2,
            price: 15.5,
          },
          {
            productId: "product-2",
            name: "product-2",
            quantity: 1,
            price: 3,
          },
        ],
        address: "Vologda, Tverskaya 1",
      },
      (err, response) => {
        if (err) return reject(err);
        if (!response) return reject(new Error("CreateOrder: empty response"));
        resolve(response);
      },
    );
  });
}

function updateOrderStatus(orderId: string, status: orderServiceGrpc.OrderStatus) {
  return new Promise<orderServiceGrpc.UpdateOrderStatusResponse>((resolve, reject) => {
    orderClient.updateOrderStatus({ orderId, status }, (err, response) => {
      if (err) 
        return reject(err);
      if (!response) 
        return reject(new Error("UpdateOrderStatus: empty response"));
      resolve(response);
    });
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  try {
    const { userId } = await registerUser();
    console.log("REGISTER (auth-service -> user-service):");
    console.log({ userId });

    const profile = await getUserProfile(userId);
    console.log("GET USER PROFILE (user-service):");
    console.log(profile);

    const created = await createOrder(userId);
    console.log("CREATE ORDER (order-service -> RabbitMQ):");
    console.log(created);

    const orderId = created.order?.id;
    if (!orderId) {
      throw new Error("Order ID not found in CreateOrder response");
    }

    await sleep(2000);

    const confirmed = await updateOrderStatus(
      orderId,
      orderServiceGrpc.OrderStatus.CONFIRMED,
    );
    console.log("CONFIRM ORDER (order-service -> RabbitMQ):");
    console.log(confirmed);

    await sleep(2000);

    const cancelled = await updateOrderStatus(
      orderId,
      orderServiceGrpc.OrderStatus.CANCELLED,
    );
    console.log("CANCEL ORDER (order-service -> RabbitMQ):");
    console.log(cancelled);
  } catch (error) {
    console.error("TEST ERROR:", error);
  } finally {
    authClient.close();
    userClient.close();
    orderClient.close();
  }
}

main();
