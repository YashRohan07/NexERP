# NexERP API Endpoints

## Overview

This document contains the main API endpoints for the NexERP MVP.

Base URL:

```txt
http://127.0.0.1:8000/api
```

Most endpoints require Laravel Sanctum authentication. Admin-only actions are protected by role middleware.

---

## System

| Method | Endpoint    | Purpose          |
| ------ | ----------- | ---------------- |
| GET    | /api/health | API health check |

---

## Auth

| Method | Endpoint         | Purpose      |
| ------ | ---------------- | ------------ |
| POST   | /api/auth/login  | User login   |
| POST   | /api/auth/logout | User logout  |
| GET    | /api/auth/me     | Current user |

---

## Products

| Method | Endpoint                | Purpose         |
| ------ | ----------------------- | --------------- |
| GET    | /api/products           | Product list    |
| POST   | /api/products           | Create product  |
| GET    | /api/products/{product} | Product details |
| PUT    | /api/products/{product} | Update product  |
| DELETE | /api/products/{product} | Delete product  |

### Product Query Params

```txt
search
size
color
per_page
```

---

## Inventory

| Method | Endpoint                              | Purpose        |
| ------ | ------------------------------------- | -------------- |
| GET    | /api/inventory                        | Inventory list |
| PATCH  | /api/inventory/{product}/adjust-stock | Adjust stock   |

### Inventory Query Params

```txt
search
stock_status
date_from
date_to
sort_by
sort_direction
per_page
```

### Stock Status Values

```txt
all
low_stock
in_stock
out_of_stock
```

---

## Suppliers

| Method | Endpoint                  | Purpose          |
| ------ | ------------------------- | ---------------- |
| GET    | /api/suppliers            | Supplier list    |
| POST   | /api/suppliers            | Create supplier  |
| GET    | /api/suppliers/{supplier} | Supplier details |
| PUT    | /api/suppliers/{supplier} | Update supplier  |
| DELETE | /api/suppliers/{supplier} | Delete supplier  |

### Supplier Query Params

```txt
search
per_page
```

---

## Purchases

| Method | Endpoint                          | Purpose          |
| ------ | --------------------------------- | ---------------- |
| GET    | /api/purchases                    | Purchase list    |
| POST   | /api/purchases                    | Create purchase  |
| GET    | /api/purchases/{purchase}         | Purchase details |
| PATCH  | /api/purchases/{purchase}/confirm | Confirm purchase |
| PATCH  | /api/purchases/{purchase}/cancel  | Cancel purchase  |

### Purchase Query Params

```txt
search
status
date_from
date_to
per_page
```

### Purchase Status Values

```txt
draft
confirmed
cancelled
```

---

## Customers

| Method | Endpoint                  | Purpose          |
| ------ | ------------------------- | ---------------- |
| GET    | /api/customers            | Customer list    |
| POST   | /api/customers            | Create customer  |
| GET    | /api/customers/{customer} | Customer details |
| PUT    | /api/customers/{customer} | Update customer  |
| DELETE | /api/customers/{customer} | Delete customer  |

### Customer Query Params

```txt
search
per_page
```

---

## Sales

| Method | Endpoint                  | Purpose      |
| ------ | ------------------------- | ------------ |
| GET    | /api/sales                | Sales list   |
| POST   | /api/sales                | Create sale  |
| GET    | /api/sales/{sale}         | Sale details |
| PATCH  | /api/sales/{sale}/confirm | Confirm sale |
| PATCH  | /api/sales/{sale}/cancel  | Cancel sale  |

### Sales Query Params

```txt
search
status
date_from
date_to
per_page
```

### Sales Status Values

```txt
draft
confirmed
cancelled
```

---

## POS

| Method | Endpoint                | Purpose             |
| ------ | ----------------------- | ------------------- |
| GET    | /api/pos/products       | POS product search  |
| POST   | /api/pos/checkout       | POS checkout        |
| GET    | /api/pos/receipt/{sale} | POS receipt details |

### POS Product Query Params

```txt
search
per_page
```

### POS Payment Methods

```txt
cash
card
mobile_banking
```

---

## Dashboard

| Method | Endpoint               | Purpose           |
| ------ | ---------------------- | ----------------- |
| GET    | /api/dashboard/summary | Dashboard summary |

### Dashboard Includes

```txt
total_products
total_quantity
inventory_value
low_stock_count
total_purchases
total_sales
low_stock_products
recent_purchases
recent_sales
```

---

## Reports

| Method | Endpoint                   | Purpose          |
| ------ | -------------------------- | ---------------- |
| GET    | /api/reports/summary       | Report summary   |
| GET    | /api/reports/inventory     | Inventory report |
| GET    | /api/reports/low-stock     | Low stock report |
| GET    | /api/reports/purchases     | Purchase report  |
| GET    | /api/reports/sales         | Sales report     |
| GET    | /api/reports/inventory/pdf | Inventory PDF    |
| GET    | /api/reports/low-stock/pdf | Low stock PDF    |
| GET    | /api/reports/purchases/pdf | Purchase PDF     |
| GET    | /api/reports/sales/pdf     | Sales PDF        |

### Report Query Params

Inventory and low-stock reports:

```txt
date_from
date_to
```

Purchase report:

```txt
date_from
date_to
```

Sales report:

```txt
date_from
date_to
sale_channel
```

### Sales Channel Values

```txt
all
sales
pos
```

---

## Access Rules

| Feature                         | Admin | Member |
| ------------------------------- | ----- | ------ |
| View dashboard                  | Yes   | Yes    |
| View products                   | Yes   | Yes    |
| Create/update/delete products   | Yes   | No     |
| View inventory                  | Yes   | Yes    |
| Adjust stock                    | Yes   | No     |
| View suppliers                  | Yes   | Yes    |
| Create/update/delete suppliers  | Yes   | No     |
| View purchases                  | Yes   | Yes    |
| Create/confirm/cancel purchases | Yes   | No     |
| View customers                  | Yes   | Yes    |
| Create/update/delete customers  | Yes   | No     |
| View sales                      | Yes   | Yes    |
| Create/confirm/cancel sales     | Yes   | No     |
| POS product search              | Yes   | Yes    |
| POS checkout                    | Yes   | No     |
| View reports                    | Yes   | Yes    |
| Download report PDFs            | Yes   | Yes    |

---

## Notes

- Authentication uses Laravel Sanctum.
- API responses return consistent JSON.
- Admin users can create, update, delete, confirm, cancel, and adjust stock.
- Member users have view-only access.
- Products and inventories use a 1:1 relationship.
- Product create also creates the initial inventory record.
- Purchase confirmation increases inventory.
- Sales confirmation decreases inventory.
- POS checkout creates a confirmed sale and decreases inventory instantly.
- Stock-sensitive operations use database transactions and row-level locking.
