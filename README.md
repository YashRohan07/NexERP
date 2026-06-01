# NexERP

NexERP is a modular ERP and business management system built with Laravel REST API, React SPA, and MySQL.

It covers product management, inventory tracking, supplier purchases, customer sales, POS checkout, dashboard insights, and PDF business reports.

---

## Tech Stack

### Backend

- Laravel 12.x
- PHP 8.3
- MySQL 8
- Laravel Sanctum
- DomPDF

### Frontend

- React 19
- Vite
- Tailwind CSS
- Axios
- React Router

### Tools

- Laragon
- Postman
- Git & GitHub
- VS Code

---

## Project Architecture

NexERP uses a modular monolith architecture.

- Laravel REST API backend
- React SPA frontend
- Laravel MVC structure inside modules
- Service-based business logic
- MySQL relational database
- Sanctum token-based authentication

---

## Modules

- Auth
- Product
- Inventory
- Purchase
- Sales
- POS
- Dashboard
- Reports

---

## Main Features

### Auth

- Login and logout
- Authenticated user API
- Laravel Sanctum authentication
- Admin and member roles
- Role-based API access

### Product

- Product CRUD
- SKU-based product records
- Search and filters
- Pagination
- Soft delete support
- Initial inventory setup

### Inventory

- Stock list
- Low stock status
- Out-of-stock status
- Manual stock adjustment
- Stock value calculation
- Search, filters, sorting, and pagination

### Purchase

- Supplier management
- Purchase draft creation
- Purchase item records
- Purchase confirmation
- Purchase cancellation
- Automatic stock increase after purchase confirmation
- Weighted average purchase cost update

### Sales

- Customer management
- Sale draft creation
- Sale item records
- Sale confirmation
- Sale cancellation
- Automatic stock decrease after sale confirmation
- Insufficient stock validation

### POS

- Product search for checkout
- Cart checkout
- Walk-in customer support
- Payment method selection
- Instant confirmed sale
- Automatic stock decrease
- Receipt-style response

### Dashboard

- Total products
- Total quantity
- Inventory value
- Low stock count
- Total purchases
- Total sales
- Recent purchases
- Recent sales
- Low stock preview

### Reports

- Inventory report
- Low stock report
- Purchase report
- Sales report
- Date range filters
- Sales channel filter
- PDF export

---

## Performance and Reliability

- Server-side pagination for list APIs
- Filterable API queries
- Eager loading to reduce N+1 query issues
- Selected relationship columns for lighter responses
- Indexed columns for search, filters, and reports
- SQL aggregate queries for dashboard and reports
- Short-lived dashboard caching
- Targeted dashboard cache invalidation after stock-changing operations
- Database transactions for stock workflows
- Row-level locking for stock-sensitive operations
- Aggregated quantity checks to prevent overselling

---

## Database Design

### Main Tables

- users
- products
- inventories
- suppliers
- purchases
- purchase_items
- customers
- sales
- sale_items
- personal_access_tokens

### Key Relationships

```txt
User authenticates with Sanctum tokens

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
```

### Business Rules

```txt
1 Product = 1 Inventory Record

Purchase confirm = stock increases
Sales confirm = stock decreases
POS checkout = confirmed sale + stock decreases instantly

Draft purchase/sale does not affect inventory
Cancelled purchase/sale does not affect inventory
Confirmed purchase/sale cannot be cancelled in the MVP
```

---

## Backend Module Structure

```txt
app/
├── Http/
│   └── Middleware/
│       └── RoleMiddleware.php
├── Models/
├── Modules/
│   ├── Auth/
│   ├── Product/
│   ├── Inventory/
│   ├── Purchase/
│   ├── Sales/
│   ├── POS/
│   ├── Dashboard/
│   └── Report/
└── Support/
    ├── ApiResponse.php
    └── AppCache.php
```

---

## Frontend Structure

```txt
src/
├── api/
├── components/
├── pages/
├── routes/
├── utils/
├── App.jsx
├── main.jsx
└── index.css
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
  "message": "NexERP API is running",
  "data": {
    "app": "NexERP",
    "environment": "local"
  }
}
```

---

## API Modules

### Auth

```txt
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Products

```txt
GET    /api/products
POST   /api/products
GET    /api/products/{product}
PUT    /api/products/{product}
DELETE /api/products/{product}
```

### Inventory

```txt
GET   /api/inventory
PATCH /api/inventory/{product}/adjust-stock
```

### Suppliers

```txt
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/{supplier}
PUT    /api/suppliers/{supplier}
DELETE /api/suppliers/{supplier}
```

### Purchases

```txt
GET   /api/purchases
POST  /api/purchases
GET   /api/purchases/{purchase}
PATCH /api/purchases/{purchase}/confirm
PATCH /api/purchases/{purchase}/cancel
```

### Customers

```txt
GET    /api/customers
POST   /api/customers
GET    /api/customers/{customer}
PUT    /api/customers/{customer}
DELETE /api/customers/{customer}
```

### Sales

```txt
GET   /api/sales
POST  /api/sales
GET   /api/sales/{sale}
PATCH /api/sales/{sale}/confirm
PATCH /api/sales/{sale}/cancel
```

### POS

```txt
GET  /api/pos/products
POST /api/pos/checkout
GET  /api/pos/receipt/{sale}
```

### Dashboard

```txt
GET /api/dashboard/summary
```

### Reports

```txt
GET /api/reports/summary
GET /api/reports/inventory
GET /api/reports/low-stock
GET /api/reports/purchases
GET /api/reports/sales

GET /api/reports/inventory/pdf
GET /api/reports/low-stock/pdf
GET /api/reports/purchases/pdf
GET /api/reports/sales/pdf
```

---

## Seeded Demo Users

| Role   | Email                                         | Password |
| ------ | --------------------------------------------- | -------- |
| admin  | [admin@nexerp.com](mailto:admin@nexerp.com)   | password |
| member | [member@nexerp.com](mailto:member@nexerp.com) | password |

---

## Local Setup

### Clone Repository

```bash
git clone https://github.com/YashRohan07/NexERP.git
cd NexERP
```

---

## Backend Setup

```bash
cd nexerp-backend

composer install

cp .env.example .env

php artisan key:generate
```

Create a MySQL database:

```txt
nexerp_db
```

Update `.env` database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nexerp_db
DB_USERNAME=root
DB_PASSWORD=
```

Run migrations and seeders:

```bash
php artisan migrate
php artisan db:seed
```

Start backend server:

```bash
php artisan serve
```

Backend URL:

```txt
http://127.0.0.1:8000
```

---

## Frontend Setup

```bash
cd ../nexerp-frontend

npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start frontend:

```bash
npm run dev
```

Frontend URL:

```txt
http://127.0.0.1:5173
```

---

## Useful Commands

### Backend

```bash
php artisan migrate
php artisan migrate:status
php artisan db:seed
php artisan route:list
php artisan optimize:clear
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
```

---

## Role Access

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
| POS checkout                    | Yes   | No     |
| View reports                    | Yes   | Yes    |
| Download report PDFs            | Yes   | Yes    |

---

## Project Scope

### Included

- Auth
- Product management
- Inventory management
- Supplier purchases
- Customer sales
- POS checkout
- Dashboard summary
- Business reports
- PDF export
- React frontend integration

### Not Included in MVP

- Accounting
- Tax/VAT
- Payment due tracking
- Supplier ledger
- Customer ledger
- Purchase return
- Sales return
- Multi-warehouse
- HR/Payroll
- Manufacturing
- Docker
- Microservices

---
