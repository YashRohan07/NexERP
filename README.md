# NexERP

NexERP is a modular ERP and business management system built with Laravel REST API and React SPA.

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

NexERP uses:

- Modular Monolith architecture
- Laravel MVC inside modules
- REST API backend
- React SPA frontend

---

## MVP Modules

The MVP includes:

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

## Database Design

### Main Tables

#### users

- id
- name
- email
- password
- role

#### products

- id
- sku
- name
- size
- color
- deleted_at

#### inventories

- id
- product_id
- quantity
- purchase_price
- purchase_date
- low_stock_threshold

---

### Relationships

```txt
Product hasOne Inventory
Inventory belongsTo Product
```

For the MVP:

```txt
1 Product = 1 Inventory Record
```

---

### Database Features

- Foreign key constraints
- Indexed columns
- Soft deletes for products
- Role-based users
- Laravel Eloquent relationships

---

## Backend Module Structure

```txt
app/Modules/
├── Auth
├── Product
├── Inventory
├── Dashboard
└── Report
```

---

## API Health Check

Endpoint:

```txt
GET /api/health
```

Example response:

```json
{
  "success": true,
  "message": "NexERP API is running"
}
```

---

## Seeded Demo Users

| Role   | Email                                         | Password |
| ------ | --------------------------------------------- | -------- |
| admin  | [admin@nexerp.com](mailto:admin@nexerp.com)   | password |
| member | [member@nexerp.com](mailto:member@nexerp.com) | password |

---

## Local Setup

### Backend Setup

```bash
git clone https://github.com/YashRohan07/NexERP.git

cd nexerp/nexerp-backend

composer install

cp .env.example .env

php artisan key:generate
```

### Database Setup

Create database:

```txt
nexerp_db
```

Then update `.env` database credentials.

Run migrations:

```bash
php artisan migrate
```

Run seeders:

```bash
php artisan db:seed
```

Start server:

```bash
php artisan serve
```

Backend URL:

```txt
http://127.0.0.1:8000
```

---
