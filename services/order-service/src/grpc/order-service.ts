import * as grpc from "@grpc/grpc-js";
import { Channel } from "amqplib";
import { orderServiceGrpc } from "../../../shared/src";
import type { OrderCancelledMessage, OrderConfirmedMessage, OrderCreatedMessage } from "../../../shared/src/types/messaging";
import Order from "../models/order.model";
import { produceOrderCancelledMessage } from "../messaging/order-cancelled.producer";
import { produceOrderConfirmedMessage } from "../messaging/order-confirmed.producer";
import { produceOrderCreatedMessage } from "../messaging/order-created.producer";

class OrderService {
  private rabbitMQChannel: Channel;

  public setRabbitMQChannel(channel: Channel): void {
    this.rabbitMQChannel = channel;
  }

  public async createOrder(
    call: grpc.ServerUnaryCall<orderServiceGrpc.CreateOrderRequest, orderServiceGrpc.CreateOrderResponse>,
    callback: grpc.sendUnaryData<orderServiceGrpc.CreateOrderResponse>,
  ) {
    const { userId, items, address } = call.request;

    if (!userId || !items.length || !address) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "User ID, items and address are required",
      });
    }

    try {
      const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order = await Order.create({
        userId,
        items,
        status: orderServiceGrpc.OrderStatus.CREATED,
        totalPrice,
        address,
      });

      const orderCreatedMessage: OrderCreatedMessage = {
        orderId: order.id,
        userId: order.userId,
        status: order.status,
        totalPrice: order.totalPrice,
        address: order.address,
      };

      if (this.rabbitMQChannel) {
        produceOrderCreatedMessage(this.rabbitMQChannel, orderCreatedMessage);
      }

      return callback(null, {
        order: this.mapOrder(order),
      });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to create order",
      });
    }
  }

  public async getOrderById(
    call: grpc.ServerUnaryCall<orderServiceGrpc.GetOrderByIdRequest, orderServiceGrpc.GetOrderByIdResponse>,
    callback: grpc.sendUnaryData<orderServiceGrpc.GetOrderByIdResponse>,
  ) {
    const { orderId } = call.request;

    if (!orderId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Order ID is required",
      });
    }

    try {
      const order = await Order.findById(orderId);

      if (!order) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Order not found",
        });
      }

      return callback(null, {
        order: this.mapOrder(order),
      });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to get order",
      });
    }
  }

  public async getOrdersByUser(
    call: grpc.ServerUnaryCall<orderServiceGrpc.GetOrdersByUserRequest, orderServiceGrpc.GetOrdersByUserResponse>,
    callback: grpc.sendUnaryData<orderServiceGrpc.GetOrdersByUserResponse>,
  ) {
    const { userId } = call.request;

    if (!userId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "User ID is required",
      });
    }

    try {
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });

      return callback(null, {
        orders: orders.map((order) => this.mapOrder(order)),
      });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to get orders",
      });
    }
  }

  public async updateOrderStatus(
    call: grpc.ServerUnaryCall<orderServiceGrpc.UpdateOrderStatusRequest, orderServiceGrpc.UpdateOrderStatusResponse>,
    callback: grpc.sendUnaryData<orderServiceGrpc.UpdateOrderStatusResponse>,
  ) {
    const { orderId, status } = call.request;

    if (!orderId || status === orderServiceGrpc.OrderStatus.UNSPECIFIED) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: "Order ID and valid status are required",
      });
    }

    try {
      const order = await Order.findByIdAndUpdate(orderId, { status }, { returnDocument: "after" });

      if (!order) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: "Order not found",
        });
      }

      if (status === orderServiceGrpc.OrderStatus.CONFIRMED && this.rabbitMQChannel) {
        const orderConfirmedMessage: OrderConfirmedMessage = {
          orderId: order.id,
          userId: order.userId,
          status: order.status,
          totalPrice: order.totalPrice,
          address: order.address,
        };

        produceOrderConfirmedMessage(this.rabbitMQChannel, orderConfirmedMessage);
      }

      if (status === orderServiceGrpc.OrderStatus.CANCELLED && this.rabbitMQChannel) {
        const orderCancelledMessage: OrderCancelledMessage = {
          orderId: order.id,
          userId: order.userId,
          status: order.status,
          totalPrice: order.totalPrice,
          address: order.address,
        };

        produceOrderCancelledMessage(this.rabbitMQChannel, orderCancelledMessage);
      }

      return callback(null, {
        order: this.mapOrder(order),
      });
    } catch (error) {
      return callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : "Failed to update order status",
      });
    }
  }

  private mapOrder(order: {
    id: string;
    userId: string;
    items: Array<{ productId: string; name: string; quantity: number; price: number }>;
    status: number;
    totalPrice: number;
    address: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): orderServiceGrpc.OrderMessage {
    return {
      id: order.id,
      userId: order.userId,
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      status: order.status,
      totalPrice: order.totalPrice,
      address: order.address,
      createdAt: order.createdAt?.toISOString() ?? "",
      updatedAt: order.updatedAt?.toISOString() ?? "",
    };
  }
}

export const orderService = new OrderService();
