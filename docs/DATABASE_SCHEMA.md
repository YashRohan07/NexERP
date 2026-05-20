# NexERP Database Schema

## Overview

NexERP will use MySQL 8 as the database.

For the MVP, the database will stay simple and focused on product inventory management.

---

## Main Tables

The MVP will use these tables:

- users
- products
- inventories

---

## Relationship

```txt
products 1 : 1 inventories
```

One product will have one inventory record.

One inventory record will belong to one product.

---

## users Table

The users table will store application users.

| Column     | Purpose                    |
| ---------- | -------------------------- |
| id         | Primary key                |
| name       | User name                  |
| email      | User email                 |
| password   | Hashed password            |
| role       | User role: admin or member |
| created_at | Created time               |
| updated_at | Updated time               |

---

## products Table

The products table will store product basic information.

| Column     | Purpose            |
| ---------- | ------------------ |
| id         | Primary key        |
| sku        | Unique product SKU |
| name       | Product name       |
| size       | Product size       |
| color      | Product color      |
| created_at | Created time       |
| updated_at | Updated time       |
| deleted_at | Soft delete time   |

Soft delete is enabled for products using the `deleted_at` column.

---

## inventories Table

The inventories table will store current stock information for each product.

| Column              | Purpose                  |
| ------------------- | ------------------------ |
| id                  | Primary key              |
| product_id          | Related product ID       |
| quantity            | Current stock quantity   |
| purchase_price      | Product purchase price   |
| purchase_date       | Product purchase date    |
| low_stock_threshold | Low stock alert quantity |
| created_at          | Created time             |
| updated_at          | Updated time             |

---

## Laravel Relationships

```txt
Product hasOne Inventory
Inventory belongsTo Product
```

The `inventories.product_id` column uses a foreign key constraint linked to `products.id`.

---

## Planned Indexes

| Table       | Column        | Reason                            |
| ----------- | ------------- | --------------------------------- |
| products    | sku           | Fast SKU search                   |
| products    | name          | Fast product search               |
| inventories | product_id    | Faster product-inventory relation |
| inventories | purchase_date | Report filtering                  |
| inventories | quantity      | Stock filtering                   |

---

## Inventory Status Logic

| Condition                       | Status       |
| ------------------------------- | ------------ |
| quantity = 0                    | Out of Stock |
| quantity <= low_stock_threshold | Low Stock    |
| quantity > low_stock_threshold  | In Stock     |

---

## Inventory Value Formula

```txt
inventory_value = quantity * purchase_price
```

This will be used in inventory listing, dashboard summary, and reports.

---

## Future Upgrade Note

Later, inventory can be extended with:

- inventory_movements
- stock_batches
- warehouses
- purchase records
- sales records
- batch tracking
