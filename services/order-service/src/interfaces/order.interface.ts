interface IOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface IOrder {
  userId: string;
  items: IOrderItem[];
  status: number;
  totalPrice: number;
  address: string;
}

export type { IOrder, IOrderItem };
