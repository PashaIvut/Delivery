# DeliveryAPI для демонстрации моих знаний Мише 

Сейчас в проекте есть:
- `auth-service`
- `user-service`
- `order-service`
- `notification-service`

Рабочий флоу:
- создание заказа через `order-service`
- публикация события `order.created` в RabbitMQ
- публикация событий `order.confirmed` и `order.cancelled`
- получение события в `notification-service`

## Стек

- `TypeScript`
- `gRPC`
- `MongoDB`
- `RabbitMQ`
- `Bun`

## Инфраструктура

### MongoDB

```bash
docker run -d --name delivery-mongo -p 27017:27017 mongo:7
```

### RabbitMQ

```bash
docker run -d --name delivery-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

## Генерация proto

Из корня проекта:

```bash
bun run generate-proto
```

## Запуск сервисов

Перед тестами поднимаются **все 4 сервиса** в отдельных терминалах. В каждом сервисе создаются `.env` на основе `.env.example`.

### user-service

```bash
cd services/user-service
bun run src/server.ts
```

### auth-service

```bash
cd services/auth-service
bun run src/server.ts
```

### order-service

```bash
cd services/order-service
bun run src/server.ts
```

### notification-service

```bash
cd services/notification-service
bun run src/server.ts
```

## Проверка

Логи событий — в терминале `notification-service`.

Оба теста начинаются одинаково:
1. `Register` в `auth-service` (внутри создаётся пользователь в `user-service`)
2. `GetUserProfile` в `user-service`
3. дальше — работа с заказами в `order-service`
4. `notification-service` получает события из RabbitMQ автоматически

Если запускать оба теста подряд, в `notification-service` будет **4 лога**:
1. `order.created` — из `test-order-read` (там тоже вызывается `CreateOrder`, а значит событие уходит в кролика)
2. `order.created` — из `test-order-events`
3. `order.confirmed` — из `test-order-events`
4. `order.cancelled` — из `test-order-events`

### Read methods

Из корня проекта:

```bash
bun run test-order-read
```

Проверяет:
- `Register` 
- `GetUserProfile`
- `CreateOrder`
- `GetOrderById`
- `GetOrdersByUser`

В терминале `notification-service` появится **1 лог** — `order.created`.

### Event flow

Из корня проекта:

```bash
bun run test-order-events
```

Проверяет:
- `Register` 
- `GetUserProfile`
- смену статуса заказа и публикацию событий в RabbitMQ

В терминале `notification-service` появятся **3 лога**:
- `order.created`
- `order.confirmed` (через паузу после создания)
- `order.cancelled` (ещё через паузу, имитируем закрытие заказа после доставки)
