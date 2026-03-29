# 🏭 IM Spinning Mills - Backend Management System

**A comprehensive textile mill management system built with Node.js, Express, and MongoDB**

**Developed by:** Team CodeMate  
**Company:** IM Spinning Mills (Pvt) Ltd  
**Location:** Sheikhupura, Punjab, Pakistan

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Seeding Data](#seeding-data)

---

## ✨ Features

### Core Modules
- ✅ **Authentication System** - JWT-based auth with refresh tokens
- ✅ **Department Management** - 13 departments (Production, Support, Executive, Administrative)
- ✅ **Staff Management** - 206+ employees across departments
- ✅ **Shift Management** - Multiple shift scheduling
- 🔄 **Machinery Management** (Coming Soon)
- 🔄 **Production Tracking** (Coming Soon)
- 🔄 **Inventory Management** (Coming Soon)

### Security Features
- 🔐 Password hashing with bcrypt
- 🎫 JWT access & refresh tokens
- 🛡️ Role-based access control (Admin, Manager, Supervisor, Staff)
- 🍪 Secure HTTP-only cookies
- ✅ Input validation with express-validator

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator
- **Security:** bcrypt, cookie-parser, cors
- **Dev Tools:** nodemon

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
│   ├── models/           # Database schemas
│   │   ├── user.model.js
│   │   ├── department.model.js
│   │   ├── staff.model.js
│   │   ├── shift.model.js
│   │   ├── machinery.model.js
│   │   ├── product.model.js
│   │   └── company.model.js
│   │
│   ├── routes/           # API routes
│   │   ├── auth.routes.js
│   │   ├── department.routes.js
│   │   ├── staff.routes.js
│   │   ├── shift.routes.js
│   │   └── healthcheck.routes.js
│   │
│   ├── middleware/       # Custom middleware
│   │   ├── auth.middleware.js
│   │   └── validator.middleware.js
│   │
│   ├── validators/       # Request validation
│   │   ├── auth.validators.js
│   │   ├── department.validators.js
│   │   ├── staff.validators.js
│   │   └── shift.validators.js
│   │
│   ├── utils/           # Utility functions
│   │   ├── api-error.js
│   │   ├── api-response.js
│   │   ├── async-handler.js
│   │   ├── constants.js
│   │   ├── seedDepartments.js
│   │   └── seedShifts.js
│   │
│   ├── db/              # Database connection
│   │   └── index.js
│   │
│   ├── app.js           # Express app setup
│   └── index.js         # Entry point
│
├── public/              # Static files
├── .env                 # Environment variables
├── .env.example         # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Step 1: Clone/Create Project

```bash
# Create project directory
mkdir im-spinning-mills-backend
cd im-spinning-mills-backend

# Initialize npm
npm init -y
```

### Step 2: Install Dependencies

```bash
# Install production dependencies
npm install express mongoose dotenv bcrypt jsonwebtoken cookie-parser cors express-validator

# Install dev dependencies
npm install --save-dev nodemon
```

### Step 3: Create Folder Structure

```bash
# Create all necessary folders
mkdir -p src/{controllers,models,routes,middleware,validators,utils,db,services}
mkdir public
```

### Step 4: Copy Code Files

Copy each artifact file to its corresponding location:
- Copy `package.json` to root
- Copy all `src/` files to their respective folders
- Copy `.env.example` and rename to `.env`
- Copy `.gitignore` to root

---

## ⚙️ Environment Setup

### Create `.env` file

```bash
# Copy from example
cp .env.example .env
```

### Configure Environment Variables

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

**⚠️ IMPORTANT:** Generate strong secrets for production!

```bash
# Generate secrets using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎬 Running the Project

### Start MongoDB

```bash
# Using MongoDB service
mongod

# Or if using MongoDB as a service
sudo systemctl start mongod
```

### Run Development Server

```bash
npm run dev
```

### Run Production Server

```bash
npm start
```

### Expected Output

```
✅ MongoDB Connected Successfully!
📦 Database Host: localhost
🏢 Database Name: im_spinning_mills
🎯 Ready for IM Spinning Mills Operations!

🚀 IM Spinning Mills Backend Server
📡 Server running on: http://localhost:8000
🏢 Company: IM Spinning Mills (Pvt) Ltd
👥 Team: CodeMate

📚 API Documentation:
   Health: http://localhost:8000/api/v1/health
   Auth: http://localhost:8000/api/v1/auth
   Departments: http://localhost:8000/api/v1/departments
   Staff: http://localhost:8000/api/v1/staff
   Shifts: http://localhost:8000/api/v1/shifts
```

---

## 📚 API Endpoints

### 🏥 Health Check
```
GET /api/v1/health
```

### 🔐 Authentication
```
POST   /api/v1/auth/register          - Register new user
POST   /api/v1/auth/login             - Login user
POST   /api/v1/auth/logout            - Logout user (Protected)
POST   /api/v1/auth/refresh-token     - Refresh access token
GET    /api/v1/auth/me                - Get current user (Protected)
POST   /api/v1/auth/change-password   - Change password (Protected)
PATCH  /api/v1/auth/update-profile    - Update profile (Protected)
```

### 🏢 Departments
```
GET    /api/v1/departments                    - Get all departments
GET    /api/v1/departments/stats/overview     - Get department statistics
GET    /api/v1/departments/type/:type         - Get departments by type
GET    /api/v1/departments/:id                - Get department by ID
POST   /api/v1/departments                    - Create department (Admin/Manager)
PATCH  /api/v1/departments/:id                - Update department (Admin/Manager)
DELETE /api/v1/departments/:id                - Delete department (Admin/Manager)
```

### 👥 Staff
```
GET    /api/v1/staff                          - Get all staff
GET    /api/v1/staff/stats/overview           - Get staff statistics
GET    /api/v1/staff/department/:departmentId - Get staff by department
GET    /api/v1/staff/:id                      - Get staff by ID
POST   /api/v1/staff                          - Create staff (Admin/Manager)
POST   /api/v1/staff/bulk-import              - Bulk import staff (Admin/Manager)
PATCH  /api/v1/staff/:id                      - Update staff (Admin/Manager)
DELETE /api/v1/staff/:id                      - Delete staff (Admin/Manager)
```

### ⏰ Shifts
```
GET    /api/v1/shifts                    - Get all shifts
GET    /api/v1/shifts/stats/overview     - Get shift statistics
GET    /api/v1/shifts/:id                - Get shift by ID
GET    /api/v1/shifts/:id/staff          - Get staff in shift
POST   /api/v1/shifts                    - Create shift (Admin/Manager)
POST   /api/v1/shifts/assign             - Assign staff to shift (Admin/Manager)
POST   /api/v1/shifts/bulk-assign        - Bulk assign staff (Admin/Manager)
PATCH  /api/v1/shifts/:id                - Update shift (Admin/Manager)
DELETE /api/v1/shifts/:id                - Delete shift (Admin/Manager)
```

---

## 🌱 Seeding Data

### Seed Departments

```bash
npm run seed:departments
```

This will create:
- 7 Production departments (Mixing → Blow Room → Carding → Drawing → Open-End → Packing → Warehouse)
- 6 Support departments (AC, Electrical, Technical, Laboratory, Workshop, Waste Plant)
- 2 Administrative departments (Executive, Administrative)

### Seed Shifts

```bash
npm run seed:shifts
```

This will create 5 shifts:
- Morning (06:00 - 14:00)
- Evening (14:00 - 22:00)
- Night (22:00 - 06:00)
- Day (08:00 - 17:00)
- General (09:00 - 18:00)

---

## 🧪 Testing with Postman

### 1. Register Admin User

```json
POST http://localhost:8000/api/v1/auth/register

{
  "username": "admin",
  "email": "admin@imspinning.com",
  "fullName": "Admin User",
  "password": "admin123",
  "role": "admin"
}
```

### 2. Login

```json
POST http://localhost:8000/api/v1/auth/login

{
  "email": "admin@imspinning.com",
  "password": "admin123"
}
```

Copy the `accessToken` from response for protected routes.

### 3. Create Department

```json
POST http://localhost:8000/api/v1/departments
Authorization: Bearer YOUR_ACCESS_TOKEN

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

**Team CodeMate** - University Project Group

---

## 📝 License

MIT License - Free for educational purposes

---

## 🤝 Contributing

This is a university project for IM Spinning Mills. Contributions are welcome from team members.

---

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Contact Team CodeMate

---

**Built with ❤️ by Team CodeMate for IM Spinning Mills**