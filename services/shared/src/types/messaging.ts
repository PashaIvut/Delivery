type OrderCreatedMessage = {
  orderId: string;
  userId: string;
  status: number;
  totalPrice: number;
  address: string;
};

type OrderConfirmedMessage = {
  orderId: string;
  userId: string;
  status: number;
  totalPrice: number;
  address: string;
};

type OrderCancelledMessage = {
  orderId: string;
  userId: string;
  status: number;
  totalPrice: number;
  address: string;
};

export type { OrderCancelledMessage, OrderConfirmedMessage, OrderCreatedMessage };
