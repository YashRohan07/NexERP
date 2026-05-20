# NexERP System Architecture

## Overview

NexERP is built as a Laravel REST API backend with a React SPA frontend.

The system follows a Modular Monolith architecture. The application stays as one Laravel project,
but features are organized by modules.

This approach keeps the project simple, maintainable, and beginner-friendly.

---

## Main Architecture Decision

NexERP uses:

- Modular Monolith architecture
- Laravel MVC inside modules
- REST API backend
- React SPA frontend
- MySQL relational database

---

## Why Modular Monolith?

This architecture is used because:

- It keeps the project organized
- It avoids unnecessary complexity
- It is easier to maintain
- It is suitable for an ERP MVP
- It supports future expansion

---

## Backend Architecture

The backend is built with Laravel 12.x.

Backend module structure:

```txt
app/
  Modules/
    Auth/
      Controllers/
      Requests/
      Services/
      Routes/

    Product/
      Controllers/
      Requests/
      Services/
      Routes/

    Inventory/
      Controllers/
      Requests/
      Services/
      Routes/

    Dashboard/
      Controllers/
      Services/
      Routes/

    Report/
      Controllers/
      Services/
      Exports/
      Routes/
```

---

## Backend Module Rules

Each module keeps related files together.

- Controllers handle requests
- Requests handle validation
- Services contain business logic
- Routes define API endpoints

Controllers should stay thin.

Business logic should be written inside services.

---

## Frontend Architecture

The frontend will be built using React 19 and Vite.

Main frontend pages:

- Login
- Dashboard
- Products
- Inventory
- Reports

The frontend will use:

- React Router
- Axios
- Tailwind CSS
- Protected routes

---

## Request Flow

```txt
React Page
  → API Call
  → Laravel Route
  → Controller
  → Request Validation
  → Service
  → Model
  → MySQL Database
  → JSON Response
```

---

## Authentication Flow

Authentication uses Laravel Sanctum.

Basic flow:

```txt
Login Request
  → Credential Check
  → Sanctum Token Create
  → Token Stored in Frontend
  → Protected API Access
```

---

## User Roles

The MVP uses two roles:

| Role   | Access           |
| ------ | ---------------- |
| admin  | Full access      |
| member | View-only access |

---

## Database Overview

Main MVP tables:

- users
- products
- inventories

Relationship:

```txt
products 1 : 1 inventories
```

Products use soft deletes through the `deleted_at` column.

The inventories table uses a foreign key relationship with products.

---

## MVP Modules

The MVP includes:

- Auth
- Product
- Inventory
- Dashboard
- Reports

---

## Not Included Now

The MVP will not include:

- Sales
- Purchase
- Accounting
- POS
- Distribution
- Manufacturing
- HR/Payroll
- Multi-warehouse inventory
- Complex permissions
- Microservices
- Docker
- Redux
- Repository Pattern

---

## Development Principles

The project follows:

- OOP
- SOLID
- DRY
- KISS
- Clean Code
