# NexERP System Architecture

## Overview

NexERP is built as a Laravel REST API backend with a React SPA frontend.

The system follows a modular monolith architecture. The application stays as one Laravel project, but the backend features are organized by modules.

This approach keeps the project simple, maintainable, and suitable for an ERP MVP.

---

## Main Architecture

NexERP uses:

- Modular monolith architecture
- Laravel MVC inside modules
- REST API backend
- React SPA frontend
- MySQL relational database
- Sanctum token-based authentication

---

## Why Modular Monolith?

This architecture is used because:

- It keeps related files grouped by feature
- It avoids unnecessary microservice complexity
- It is easier to maintain and debug
- It fits the MVP scope
- It can be extended later with new modules

---

## Backend Architecture

The backend is built with Laravel 12.x.

Backend module structure:

```txt
app/
├── Http/
│   └── Middleware/
│       └── RoleMiddleware.php
├── Models/
├── Modules/
│   ├── Auth/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   ├── Services/
│   │   └── Routes/
│   ├── Product/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   ├── Services/
│   │   └── Routes/
│   ├── Inventory/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   ├── Services/
│   │   └── Routes/
│   ├── Purchase/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   ├── Services/
│   │   └── Routes/
│   ├── Sales/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   ├── Services/
│   │   └── Routes/
│   ├── POS/
│   │   ├── Controllers/
│   │   ├── Requests/
│   │   ├── Services/
│   │   └── Routes/
│   ├── Dashboard/
│   │   ├── Controllers/
│   │   ├── Services/
│   │   └── Routes/
│   └── Report/
│       ├── Controllers/
│       ├── Requests/
│       ├── Services/
│       ├── Exports/
│       └── Routes/
└── Support/
    ├── ApiResponse.php
    └── AppCache.php
```

---

## Backend Module Rules

Each module keeps related backend files together.

- Controllers handle HTTP requests
- Requests handle validation
- Services contain business logic
- Routes define module endpoints
- Models represent database tables and relationships
- Support classes contain shared helpers

Controllers should stay thin.

Business rules should be written inside services.

---

## Request Flow

```txt
React Page
  → API Call
  → Laravel Route
  → Middleware
  → Controller
  → Form Request Validation
  → Service
  → Eloquent Model
  → MySQL Database
  → JSON Response
```

---

## Authentication Flow

Authentication uses Laravel Sanctum.

```txt
Login request
  → Validate credentials
  → Create Sanctum token
  → Return token and user data
  → Frontend stores token
  → Protected API requests use Bearer token
```

---

## User Roles

The MVP uses two roles:

| Role   | Access           |
| ------ | ---------------- |
| admin  | Full access      |
| member | View-only access |

Role protection is handled by middleware.

---

## Backend Modules

### Auth Module

Handles:

- Login
- Logout
- Current user
- Sanctum token creation
- Role-based access support

### Product Module

Handles:

- Product CRUD
- Search and filters
- Pagination
- Soft delete
- Initial inventory creation

### Inventory Module

Handles:

- Inventory list
- Stock status
- Manual stock adjustment
- Low-stock filtering
- Stock value calculation

### Purchase Module

Handles:

- Supplier CRUD
- Purchase draft creation
- Purchase items
- Purchase confirmation
- Purchase cancellation
- Stock increase after confirmation
- Weighted average purchase price update

### Sales Module

Handles:

- Customer CRUD
- Sale draft creation
- Sale items
- Sale confirmation
- Sale cancellation
- Stock decrease after confirmation
- Insufficient stock validation

### POS Module

Handles:

- POS product search
- Walk-in customer checkout
- Existing customer checkout
- Payment method selection
- Confirmed sale creation
- Stock decrease during checkout
- Receipt-style response

### Dashboard Module

Handles:

- Summary metrics
- Inventory value
- Low-stock count
- Recent purchases
- Recent sales
- Low-stock preview
- Short-lived dashboard caching

### Report Module

Handles:

- Inventory report
- Low stock report
- Purchase report
- Sales report
- Date filters
- Sales channel filter
- PDF export

---

## Frontend Architecture

The frontend is built with React 19 and Vite.

Main frontend areas:

- Login
- Dashboard
- Products
- Inventory
- Suppliers
- Purchases
- Customers
- Sales
- POS
- Reports

The frontend uses:

- React Router
- Axios
- Tailwind CSS
- Protected routes
- Reusable UI components
- Role-based UI conditions

---

## Database Overview

Main tables:

- users
- products
- inventories
- suppliers
- purchases
- purchase_items
- customers
- sales
- sale_items

Core relationships:

```txt
Product hasOne Inventory
Inventory belongsTo Product

Supplier hasMany Purchases
Purchase belongsTo Supplier
Purchase hasMany PurchaseItems

Customer hasMany Sales
Sale belongsTo Customer
Sale hasMany SaleItems

Product hasMany PurchaseItems
Product hasMany SaleItems
```

---

## Inventory Flow

```txt
Product create
  → Initial inventory record created

Purchase confirm
  → Inventory quantity increases
  → Purchase price updates using weighted average cost

Sale confirm
  → Stock availability checked
  → Inventory quantity decreases

POS checkout
  → Confirmed sale created
  → Stock availability checked
  → Inventory quantity decreases instantly

Manual adjustment
  → Inventory quantity updates directly
```

---

## Stock Safety

Stock-sensitive operations use:

- Database transactions
- Row-level locking
- Stock availability validation
- Aggregated quantity checks for duplicate product lines

This helps prevent overselling and race conditions during concurrent requests.

---

## Dashboard and Reports

Dashboard is used for quick business overview.

Reports are used for detailed filtered data and PDF export.

| Area      | Purpose                          |
| --------- | -------------------------------- |
| Dashboard | Quick metrics and recent records |
| Reports   | Detailed data and PDF export     |

Dashboard uses short-lived caching. The cache is cleared after stock-changing operations so summary data stays accurate.

---

## Performance Notes

NexERP includes practical MVP-level performance improvements:

- Server-side pagination
- Search and filters
- Eager loading
- Selected relationship columns
- Indexed database columns
- SQL aggregate queries
- Dashboard caching
- Targeted cache invalidation
- Composite indexes for report filters

---

## Not Included in MVP

The MVP does not include:

- Accounting
- Tax/VAT
- Payment due tracking
- Supplier ledger
- Customer ledger
- Purchase return
- Sales return
- Multi-warehouse inventory
- Stock batches
- Activity logs
- HR/Payroll
- Manufacturing
- Microservices
- Docker
- Redux
- Repository Pattern

---

## Development Principles

The project follows:

- OOP
- MVC
- DRY
- KISS
- Thin controllers
- Service-based business logic
- Consistent API responses
