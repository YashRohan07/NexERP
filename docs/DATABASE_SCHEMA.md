# NexERP Database Schema

## Overview

NexERP uses MySQL 8 as the database.

The database is designed for a modular ERP MVP with products, inventory, suppliers, purchases, customers, sales, POS checkout, dashboard summaries, and reports.

---

## Main Tables

- users
- products
- inventories
- suppliers
- purchases
- purchase_items
- customers
- sales
- sale_items

---

## users Table

The `users` table stores application users.

| Column            | Purpose                    |
| ----------------- | -------------------------- |
| id                | Primary key                |
| name              | User name                  |
| email             | Unique user email          |
| email_verified_at | Email verification time    |
| password          | Hashed password            |
| role              | User role: admin or member |
| remember_token    | Remember token             |
| created_at        | Created time               |
| updated_at        | Updated time               |

---

## products Table

The `products` table stores product master data.

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

Products use soft deletes so historical purchase and sales records can remain safe.

---

## inventories Table

The `inventories` table stores the current stock record for each product.

| Column              | Purpose                  |
| ------------------- | ------------------------ |
| id                  | Primary key              |
| product_id          | Related product ID       |
| quantity            | Current stock quantity   |
| purchase_price      | Current unit cost        |
| purchase_date       | Last purchase date       |
| low_stock_threshold | Low stock alert quantity |
| created_at          | Created time             |
| updated_at          | Updated time             |

For the MVP:

```txt
1 Product = 1 Inventory Record
```

---

## suppliers Table

The `suppliers` table stores supplier information.

| Column     | Purpose          |
| ---------- | ---------------- |
| id         | Primary key      |
| name       | Supplier name    |
| phone      | Supplier phone   |
| email      | Supplier email   |
| address    | Supplier address |
| created_at | Created time     |
| updated_at | Updated time     |

---

## purchases Table

The `purchases` table stores purchase headers.

| Column        | Purpose                        |
| ------------- | ------------------------------ |
| id            | Primary key                    |
| supplier_id   | Related supplier ID            |
| purchase_date | Purchase date                  |
| status        | draft, confirmed, or cancelled |
| total_amount  | Purchase total amount          |
| note          | Optional note                  |
| created_at    | Created time                   |
| updated_at    | Updated time                   |

---

## purchase_items Table

The `purchase_items` table stores purchase line items.

| Column         | Purpose               |
| -------------- | --------------------- |
| id             | Primary key           |
| purchase_id    | Related purchase ID   |
| product_id     | Related product ID    |
| quantity       | Purchase quantity     |
| purchase_price | Purchase unit price   |
| line_total     | Quantity × unit price |
| created_at     | Created time          |
| updated_at     | Updated time          |

---

## customers Table

The `customers` table stores customer information.

| Column     | Purpose          |
| ---------- | ---------------- |
| id         | Primary key      |
| name       | Customer name    |
| phone      | Customer phone   |
| email      | Customer email   |
| address    | Customer address |
| created_at | Created time     |
| updated_at | Updated time     |

---

## sales Table

The `sales` table stores sales headers for both normal sales and POS sales.

| Column         | Purpose                             |
| -------------- | ----------------------------------- |
| id             | Primary key                         |
| customer_id    | Related customer ID                 |
| sale_date      | Sale date                           |
| status         | draft, confirmed, or cancelled      |
| sale_channel   | sales or pos                        |
| payment_method | cash, card, mobile_banking, or null |
| total_amount   | Sale total amount                   |
| note           | Optional note                       |
| created_at     | Created time                        |
| updated_at     | Updated time                        |

---

## sale_items Table

The `sale_items` table stores sale line items.

| Column        | Purpose                  |
| ------------- | ------------------------ |
| id            | Primary key              |
| sale_id       | Related sale ID          |
| product_id    | Related product ID       |
| quantity      | Sale quantity            |
| selling_price | Selling unit price       |
| line_total    | Quantity × selling price |
| created_at    | Created time             |
| updated_at    | Updated time             |

---

## Relationships

```txt
Product hasOne Inventory
Inventory belongsTo Product

Supplier hasMany Purchases
Purchase belongsTo Supplier

Purchase hasMany PurchaseItems
PurchaseItem belongsTo Purchase
PurchaseItem belongsTo Product

Customer hasMany Sales
Sale belongsTo Customer

Sale hasMany SaleItems
SaleItem belongsTo Sale
SaleItem belongsTo Product

Product hasMany PurchaseItems
Product hasMany SaleItems
```

---

## Business Rules

```txt
Product create = product record + initial inventory record

Purchase draft = inventory unchanged
Purchase confirm = inventory quantity increases
Purchase cancel = only draft purchase can be cancelled

Sale draft = inventory unchanged
Sale confirm = inventory quantity decreases
Sale cancel = only draft sale can be cancelled

POS checkout = confirmed sale + inventory quantity decreases instantly
```

---

## Stock Status Logic

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

Used in:

- Inventory listing
- Dashboard summary
- Inventory report
- Low stock report

---

## Purchase Cost Formula

Purchase confirmation updates inventory cost using weighted average cost.

```txt
new_price = ((old_qty * old_price) + (purchase_qty * purchase_price)) / (old_qty + purchase_qty)
```

If old quantity is zero:

```txt
new_price = purchase_price
```

---

## Indexes

| Table          | Column / Columns        | Reason                           |
| -------------- | ----------------------- | -------------------------------- |
| users          | role                    | Role filtering                   |
| products       | sku unique              | Unique SKU and fast SKU search   |
| products       | name                    | Product search                   |
| products       | size                    | Product filter                   |
| products       | color                   | Product filter                   |
| inventories    | product_id unique       | One inventory record per product |
| inventories    | purchase_date           | Inventory report filtering       |
| inventories    | quantity                | Stock filtering                  |
| suppliers      | name                    | Supplier search                  |
| suppliers      | phone                   | Supplier search                  |
| suppliers      | email                   | Supplier search                  |
| purchases      | supplier_id             | Purchase relationship            |
| purchases      | status                  | Purchase status filter           |
| purchases      | purchase_date           | Purchase date filter             |
| purchases      | status, purchase_date   | Purchase report filtering        |
| purchase_items | purchase_id             | Purchase item lookup             |
| purchase_items | product_id              | Product purchase history         |
| customers      | name                    | Customer search                  |
| customers      | phone                   | Customer search                  |
| customers      | email                   | Customer search                  |
| sales          | customer_id             | Sales relationship               |
| sales          | status                  | Sale status filter               |
| sales          | sale_date               | Sale date filter                 |
| sales          | sale_channel            | Sales/POS filter                 |
| sales          | payment_method          | Payment method filter            |
| sales          | status, sale_date       | Sales report filtering           |
| sales          | sale_channel, sale_date | POS/sales report filtering       |
| sale_items     | sale_id                 | Sale item lookup                 |
| sale_items     | product_id              | Product sales history            |

---

## Data Integrity Notes

- Supplier deletion is blocked if purchase records exist.
- Customer deletion is blocked if sales records exist.
- Product uses soft delete instead of hard delete.
- Purchase and sale item product relationships include soft-deleted products for historical records.
- Stock updates use database transactions.
- Stock-sensitive updates use row-level locking.
- Duplicate product lines are aggregated during stock validation to prevent overselling.

---

## Future Upgrade Notes

Later, the database can be extended with:

- inventory_movements
- stock_batches
- warehouses
- purchase_returns
- sales_returns
- payment tracking
- supplier ledger
- customer ledger
- tax/VAT
- accounting module
