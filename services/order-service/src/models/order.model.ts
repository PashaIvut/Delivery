import mongoose, { Document, Schema } from "mongoose";
import { IOrder, IOrderItem } from "../interfaces/order.interface";
import { orderServiceGrpc } from "../../../shared/src";

interface IOrderItemDocument extends IOrderItem, Document {}
interface IOrderDocument extends IOrder, Document {}

const OrderItemSchema = new Schema<IOrderItemDocument>(
  {
    productId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    status: {
      type: Number,
      required: true,
      default: orderServiceGrpc.OrderStatus.CREATED,
      enum: Object.values(orderServiceGrpc.OrderStatus).filter((value) => typeof value === "number"),
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Order = mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;
