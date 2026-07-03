# 🏭 IM Spinning Mills - Backend Management System

A comprehensive textile mill management system built with **Node.js**, **Express**, and **MongoDB**

> **Developed by:** Team CodeMate  
> **Company:** IM Spinning Mills (Pvt) Ltd  
> **Location:** Sheikhupura, Punjab, Pakistan

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Running the Project](#-running-the-project)
- [API Endpoints](#-api-endpoints)
- [Seeding Data](#-seeding-data)

---

## ✨ Features

### Core Modules

- ✅ **Authentication System** - JWT-based auth with refresh tokens
- ✅ **Department Management** - 13 departments (Production, Support, Executive, Administrative)
- ✅ **Staff Management** - 206+ employees across departments
- ✅ **Shift Management** - Multiple shift scheduling
- 🔄 **Machinery Management** *(Coming Soon)*
- 🔄 **Production Tracking** *(Coming Soon)*
- 🔄 **Inventory Management** *(Coming Soon)*

### Security Features

- 🔐 Password hashing with bcrypt
- 🎫 JWT access & refresh tokens
- 🛡️ Role-based access control (Admin, Manager, Supervisor, Staff)
- 🍪 Secure HTTP-only cookies
- ✅ Input validation with express-validator

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB with Mongoose ODM |
| Authentication | JWT (jsonwebtoken) |
| Validation | express-validator |
| Security | bcrypt, cookie-parser, cors |
| Dev Tools | nodemon |

---

## 📁 Project Structure

```
im-spinning-mills-backend/
├── src/
│   ├── controllers/       # Business logic
│   │   ├── auth.controllers.js
│   │   ├── department.controllers.js
│   │   ├── staff.controllers.js
│   │   ├── shift.controllers.js
│   │   └── healthcheck.controller.js
│   │
│   ├── models/            # Database schemas
│   │   ├── user.model.js
│   │   ├── department.model.js
│   │   ├── staff.model.js
│   │   ├── shift.model.js
│   │   ├── machinery.model.js
│   │   ├── product.model.js
│   │   └── company.model.js
│   │
│   ├── routes/            # API routes
│   │   ├── auth.routes.js
│   │   ├── department.routes.js
│   │   ├── staff.routes.js
│   │   ├── shift.routes.js
│   │   └── healthcheck.routes.js
│   │
│   ├── middleware/        # Custom middleware
│   │   ├── auth.middleware.js
│   │   └── validator.middleware.js
│   │
│   ├── validators/        # Request validation
│   │   ├── auth.validators.js
│   │   ├── department.validators.js
│   │   ├── staff.validators.js
│   │   └── shift.validators.js
│   │
│   ├── utils/             # Utility functions
│   │   ├── api-error.js
│   │   ├── api-response.js
│   │   ├── async-handler.js
│   │   ├── constants.js
│   │   ├── seedDepartments.js
│   │   └── seedShifts.js
│   │
│   ├── db/                # Database connection
│   │   └── index.js
│   │
│   ├── app.js             # Express app setup
│   └── index.js           # Entry point
│
├── public/                # Static files
├── .env.example           # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [MongoDB](https://www.mongodb.com/) v4.4 or higher
- npm or yarn

### Step 1: Clone the Repository

```bash
git clone https://github.com/aqsa-akram/IM-Spinning-Mill.git
cd IM-Spinning-Mill
```

### Step 2: Install Dependencies

```bash
# Install production dependencies
npm install express mongoose dotenv bcrypt jsonwebtoken cookie-parser cors express-validator

# Install dev dependencies
npm install --save-dev nodemon
```

---

## ⚙️ Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server
PORT=8000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/im_spinning_mills

# JWT Secrets (Generate strong secrets!)
ACCESS_TOKEN_SECRET=your_secret_key_here_min_32_characters
ACCESS_TOKEN_EXPIRY=15m

REFRESH_TOKEN_SECRET=another_secret_key_here_min_32_characters
REFRESH_TOKEN_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ **IMPORTANT:** Generate strong secrets for production!
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 🎬 Running the Project

```bash
# Development
npm run dev

# Production
npm start
```

**Expected Output:**
```
✅ MongoDB Connected Successfully!
🚀 IM Spinning Mills Backend Server running on: http://localhost:8000
```

---

## 📚 API Endpoints

### 🏥 Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Server health check |

### 🔐 Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Register new user |
| POST | `/api/v1/auth/login` | Public | Login user |
| POST | `/api/v1/auth/logout` | Protected | Logout user |
| POST | `/api/v1/auth/refresh-token` | Public | Refresh access token |
| GET | `/api/v1/auth/me` | Protected | Get current user |
| POST | `/api/v1/auth/change-password` | Protected | Change password |
| PATCH | `/api/v1/auth/update-profile` | Protected | Update profile |

### 🏢 Departments

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/departments` | Public | Get all departments |
| GET | `/api/v1/departments/stats/overview` | Public | Department statistics |
| GET | `/api/v1/departments/type/:type` | Public | Get by type |
| GET | `/api/v1/departments/:id` | Public | Get by ID |
| POST | `/api/v1/departments` | Admin/Manager | Create department |
| PATCH | `/api/v1/departments/:id` | Admin/Manager | Update department |
| DELETE | `/api/v1/departments/:id` | Admin/Manager | Delete department |

### 👥 Staff

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/staff` | Public | Get all staff |
| GET | `/api/v1/staff/stats/overview` | Public | Staff statistics |
| GET | `/api/v1/staff/department/:id` | Public | Get staff by department |
| GET | `/api/v1/staff/:id` | Public | Get staff by ID |
| POST | `/api/v1/staff` | Admin/Manager | Create staff |
| POST | `/api/v1/staff/bulk-import` | Admin/Manager | Bulk import staff |
| PATCH | `/api/v1/staff/:id` | Admin/Manager | Update staff |
| DELETE | `/api/v1/staff/:id` | Admin/Manager | Delete staff |

### ⏰ Shifts

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/shifts` | Public | Get all shifts |
| GET | `/api/v1/shifts/stats/overview` | Public | Shift statistics |
| GET | `/api/v1/shifts/:id` | Public | Get shift by ID |
| GET | `/api/v1/shifts/:id/staff` | Public | Get staff in shift |
| POST | `/api/v1/shifts` | Admin/Manager | Create shift |
| POST | `/api/v1/shifts/assign` | Admin/Manager | Assign staff to shift |
| POST | `/api/v1/shifts/bulk-assign` | Admin/Manager | Bulk assign staff |
| PATCH | `/api/v1/shifts/:id` | Admin/Manager | Update shift |
| DELETE | `/api/v1/shifts/:id` | Admin/Manager | Delete shift |

---

## 🌱 Seeding Data

```bash
# Seed departments
npm run seed:departments
```

Creates 13 departments:
- 7 Production: Mixing → Blow Room → Carding → Drawing → Open-End → Packing → Warehouse
- 6 Support: AC, Electrical, Technical, Laboratory, Workshop, Waste Plant
- 2 Administrative: Executive, Administrative

```bash
# Seed shifts
npm run seed:shifts
```

Creates 5 shifts:

| Shift | Time |
|---|---|
| Morning | 06:00 - 14:00 |
| Evening | 14:00 - 22:00 |
| Night | 22:00 - 06:00 |
| Day | 08:00 - 17:00 |
| General | 09:00 - 18:00 |

---

## 🧪 Testing with Postman

### 1. Register Admin User

```
POST http://localhost:8000/api/v1/auth/register
```
```json
{
  "username": "admin",
  "email": "admin@imspinning.com",
  "fullName": "Admin User",
  "password": "admin123",
  "role": "admin"
}
```

### 2. Login

```
POST http://localhost:8000/api/v1/auth/login
```
```json
{
  "email": "admin@imspinning.com",
  "password": "admin123"
}
```

### 3. Create Department

```
POST http://localhost:8000/api/v1/departments
Authorization: Bearer YOUR_ACCESS_TOKEN
```
```json
{
  "departmentName": "Mixing Department",
  "departmentCode": "MIX",
  "departmentType": "production",
  "sequenceOrder": 1,
  "description": "Fiber blending and preparation",
  "shiftHours": 24,
  "dailyCapacity": 1000
}
```

---

## 👨‍💻 Development Team

**Team CodeMate** — University Project Group

---

## 📝 License

MIT License — Free for educational purposes

---

## 🤝 Contributing

This is a university project for IM Spinning Mills. Contributions are welcome from team members.

---

*Built with ❤️ by Team CodeMate for IM Spinning Mills*



