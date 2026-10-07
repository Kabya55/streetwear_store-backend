# 🚀 MIRALOU Streetwear Store — Backend API

Production-ready REST API for the **MIRALOU Streetwear Store**, built with **Node.js**, **Express.js**, **MongoDB Atlas (Mongoose)**, **JWT Authentication**, and **SSLCommerz Bangladesh Payment Gateway**.

---

## ⚡ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: JWT & HTTP-Only secure cookies + Bcrypt password hashing
- **Payment Gateway**: SSLCommerz Bangladesh (Sandbox & Live)
- **Deployment**: Vercel Serverless Function & Node.js Server ready

---

## 📁 Repository Structure

```text
streetwear_store-backend/
├── api/
│   └── index.js                 # Vercel serverless entry point
├── src/
│   ├── config/
│   │   └── db.js                # MongoDB connection handler
│   ├── controllers/
│   │   ├── auth.controller.js   # User registration, login, logout, me
│   │   ├── product.controller.js# Products CRUD & stock management
│   │   ├── cart.controller.js   # Persistent user cart
│   │   ├── order.controller.js  # Order creation & history
│   │   ├── payment.controller.js# SSLCommerz initiate, IPN, success & fail
│   │   ├── admin.controller.js  # Admin metrics & order management
│   │   └── settings.controller.js# Site configuration & banners
│   ├── middleware/
│   │   └── auth.js              # Token verification & requireAdmin guard
│   ├── models/
│   │   ├── User.js              # User schema with roles ('user', 'admin')
│   │   ├── Product.js           # Sneaker schema with sizes & stock
│   │   ├── Category.js          # Sneaker categories
│   │   ├── Cart.js              # Cart model
│   │   ├── Order.js             # Orders with SSLCommerz transaction data
│   │   └── Setting.js           # Global store settings
│   ├── routes/
│   │   ├── auth.routes.js       # /api/auth
│   │   ├── product.routes.js    # /api/products
│   │   ├── cart.routes.js       # /api/cart
│   │   ├── order.routes.js      # /api/orders
│   │   ├── payment.routes.js    # /api/payment
│   │   ├── admin.routes.js      # /api/admin
│   │   └── settings.routes.js   # /api/settings
│   ├── app.js                   # Express app setup & route mounting
│   ├── server.js                # Local server entry (Port 5000)
│   └── seed.js                  # Initial DB seeder (Admin, demo shoes)
├── .env.example                 # Environment variables template
├── .gitignore                   # Ignored files & secrets
├── package.json
└── vercel.json                  # Serverless deployment configuration
```

---

## 🚀 Getting Started

### 1. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Set the required credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
BACKEND_PUBLIC_URL=http://localhost:5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.l46db0x.mongodb.net/streetwear_store
BETTER_AUTH_SECRET=your_32_character_jwt_secret
SSLCOMMERZ_STORE_ID=your_sslcommerz_store_id
SSLCOMMERZ_STORE_PASSWORD=your_sslcommerz_store_password
SSLCOMMERZ_IS_SANDBOX=true
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Seed Database (Optional)

To seed initial categories, admin account, and demo sneakers:

```bash
npm run seed
```

### 4. Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`. Health check endpoint: `http://localhost:5000/health`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Login user | No |
| `GET` | `/api/auth/me` | Current user profile | Yes |
| `GET` | `/api/products` | Get list of sneakers | No |
| `GET` | `/api/products/:id` | Get sneaker details | No |
| `POST` | `/api/payment/initiate`| Start SSLCommerz payment | Yes |
| `POST` | `/api/payment/success` | SSLCommerz success callback | No |
| `GET` | `/api/admin/metrics` | Admin sales metrics | Admin only |
