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
    client.updateOrderStatus({ orderId, status }, (err, response) => {
      if (err) return reject(err);
      if (!response) return reject(new Error("UpdateOrderStatus: empty response"));
      resolve(response);
    });
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    await sleep(2000);

    const confirmed = await updateOrderStatus(
      orderId,
      orderServiceGrpc.OrderStatus.CONFIRMED,
    );
    console.log("CONFIRM ORDER:");
    console.log(confirmed);

    await sleep(2000);

    const cancelled = await updateOrderStatus(
      orderId,
      orderServiceGrpc.OrderStatus.CANCELLED,
    );
    console.log("CANCEL ORDER:");
    console.log(cancelled);
  } catch (error) {
    console.error("TEST ERROR:", error);
  } finally {
    client.close();
  }
}

main();