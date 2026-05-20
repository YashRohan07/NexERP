# NexERP API Endpoints

## Overview

This document contains the planned API endpoints for the NexERP MVP.

Base URL:

```txt
http://127.0.0.1:8000/api
```

---

# System

| Method | Endpoint    | Purpose          |
| ------ | ----------- | ---------------- |
| GET    | /api/health | API health check |

---

# Auth

| Method | Endpoint         | Purpose      |
| ------ | ---------------- | ------------ |
| POST   | /api/auth/login  | User login   |
| POST   | /api/auth/logout | User logout  |
| GET    | /api/auth/me     | Current user |

---

# Products

| Method | Endpoint           | Purpose         |
| ------ | ------------------ | --------------- |
| GET    | /api/products      | Product list    |
| POST   | /api/products      | Create product  |
| GET    | /api/products/{id} | Product details |
| PUT    | /api/products/{id} | Update product  |
| DELETE | /api/products/{id} | Delete product  |

---

# Inventory

| Method | Endpoint                              | Purpose        |
| ------ | ------------------------------------- | -------------- |
| GET    | /api/inventory                        | Inventory list |
| PATCH  | /api/inventory/{product}/adjust-stock | Adjust stock   |

---

# Dashboard

| Method | Endpoint               | Purpose           |
| ------ | ---------------------- | ----------------- |
| GET    | /api/dashboard/summary | Dashboard summary |

## Dashboard Calculations

```txt
total_products = count(products)

total_quantity = sum(inventories.quantity)

inventory_value = sum(quantity * purchase_price)

low_stock_count = count(quantity <= low_stock_threshold)
```

---

# Reports

| Method | Endpoint                   | Purpose          |
| ------ | -------------------------- | ---------------- |
| GET    | /api/reports/summary       | Report summary   |
| GET    | /api/reports/inventory     | Inventory report |
| GET    | /api/reports/low-stock     | Low stock report |
| GET    | /api/reports/inventory/pdf | Inventory PDF    |
| GET    | /api/reports/low-stock/pdf | Low stock PDF    |

---

# Access Rules

| Role   | Access      |
| ------ | ----------- |
| admin  | Full access |
| member | View only   |

---

# Notes

- Authentication will use Laravel Sanctum
- API responses will return JSON
- Products and inventories use a 1:1 relationship
- Product and inventory create operations will use DB transaction
