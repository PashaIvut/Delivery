import * as authServiceGrpc from "./proto/auth/auth_service";
import * as userServiceGrpc from "./proto/user/user_service";
import * as orderServiceGrpc from "./proto/order/order_service";
import * as orderMessaging from "./messaging/order";
import type { OrderCancelledMessage, OrderConfirmedMessage, OrderCreatedMessage } from "./types/messaging";

export { authServiceGrpc, userServiceGrpc, orderServiceGrpc, orderMessaging };
export type { OrderCancelledMessage, OrderConfirmedMessage, OrderCreatedMessage };
