const ORDER_EXCHANGE = "order-events";

const OrderRoutingKeys = {
  ORDER_CREATED: "order.created",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_CANCELLED: "order.cancelled",
} as const;

const OrderQueues = {
  ORDER_CREATED_NOTIFICATION_QUEUE: "order-created-notification-queue",
  ORDER_CONFIRMED_NOTIFICATION_QUEUE: "order-confirmed-notification-queue",
  ORDER_CANCELLED_NOTIFICATION_QUEUE: "order-cancelled-notification-queue",
} as const;

export { ORDER_EXCHANGE, OrderRoutingKeys, OrderQueues };
