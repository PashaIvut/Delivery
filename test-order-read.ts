import { credentials } from "@grpc/grpc-js";
import { orderServiceGrpc } from "./services/shared/src";

const client = new orderServiceGrpc.OrderServiceClient(
  "localhost:50053",
  credentials.createInsecure(),
);

function createOrder() {
  return new Promise<orderServiceGrpc.CreateOrderResponse>((resolve, reject) => {
    client.createOrder(
      {
        userId: "user-123",
        items: [
          {
            productId: "product-1",
            name: "Pizza",
            quantity: 2,
            price: 15.5,
          },
          {
            productId: "product-2",
            name: "Cola",
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

function getOrderById(orderId: string) {
  return new Promise<orderServiceGrpc.GetOrderByIdResponse>((resolve, reject) => {
    client.getOrderById({ orderId }, (err, response) => {
      if (err) return reject(err);
      if (!response) return reject(new Error("GetOrderById: empty response"));
      resolve(response);
    });
  });
}

function getOrdersByUser(userId: string) {
  return new Promise<orderServiceGrpc.GetOrdersByUserResponse>((resolve, reject) => {
    client.getOrdersByUser({ userId }, (err, response) => {
      if (err) return reject(err);
      if (!response) return reject(new Error("GetOrdersByUser: empty response"));
      resolve(response);
    });
  });
}

async function main() {
  try {
    const created = await createOrder();
    console.log("CREATE ORDER:");
    console.log(created);

    const orderId = created.order?.id;
    if (!orderId) {
      throw new Error("Order ID not found in CreateOrder response");
    }

    const byId = await getOrderById(orderId);
    console.log("GET ORDER BY ID:");
    console.log(byId);

    const byUser = await getOrdersByUser("user-123");
    console.log("GET ORDERS BY USER:");
    console.log(byUser);
  } catch (error) {
    console.error("TEST ERROR:", error);
  } finally {
    client.close();
  }
}

main();
