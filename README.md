# NexERP

NexERP is a modular ERP and business management system built with Laravel REST API and React SPA.

The goal of this project is to build a clean, realistic, and beginner-friendly ERP MVP for learning, office submission, and portfolio use.

---

## Tech Stack

### Backend

- Laravel 12.x
- PHP 8.3
- MySQL 8
- Laravel Sanctum

### Frontend

- React 19
- Vite
- Tailwind CSS

### Tools

- Laragon
- Postman
- Git & GitHub
- VS Code

---

## Project Architecture

NexERP will use:

- Modular Monolith architecture
- Laravel MVC inside modules
- REST API backend
- React SPA frontend

---

## MVP Modules

The MVP will include:

- Auth
- Product
- Inventory
- Dashboard
- Reports

---

## Main Features

### Auth

- Login
- Logout
- Auth user
- Role-based access

### Product

- Product CRUD
- Search
- Filter
- Pagination

### Inventory

- Stock management
- Low stock status
- Stock adjustment

### Dashboard

- Total products
- Total quantity
- Inventory value
- Low stock count

### Reports

- Inventory report
- Low stock report
- PDF export

---

## Database Plan

Main tables:

- users
- products
- inventories

Relationship:

```txt
products 1 : 1 inventories
```
````

---

## User Roles

| Role   | Access      |
| ------ | ----------- |
| admin  | Full access |
| member | View only   |

---

## Future Upgrade Note

Later, inventory can be extended using:

- inventory_movements
- stock_batches
- warehouse support
- batch tracking

These are not included in the current MVP.


