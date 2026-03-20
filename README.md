# ✦ Fusion Star E-Commerce Platform

A premium, full-stack E-commerce platform built heavily relying on robust REST APIs, modern web standards, and high-performance design aesthetics.

Fusion Star serves as a complete shopping experience, thoughtfully localized for the **Indian Consumer Market**. It utilizes native ₹ (INR) pricing formats, MSRP discount tracking logic (Flipkart/Amazon style "Save %" banners), and shipping processes customized for Indian Pin Codes.

## 🚀 Features
* **Modern UI/UX**: Glassmorphism elements, CSS custom variables, lightning-fast animations, and a rich responsive design.
* **Authentication**: Secure JWT-based registration and login system.
* **Product Catalog**: Advanced product browsing, keyword search, categories, and dynamic filtering.
* **Shopping Cart**: Real-time quantity manipulation, calculation of sub-totals, and free shipping thresholds (over ₹500).
* **Payment Integration**: Live mock checkouts powered by **Stripe Elements**, ensuring compliance and secure data flow.
* **Admin Dashboard**: Full CRUD (Create, Read, Update, Delete) capability on Products, Order fulfillment status modification, and live Revenue/User analytics tracking.
* **Database Seeding**: One-command seed population to instantly spin up an authentic database of smartphones, fashion, home goods, and books.

## 🛠️ Technology Stack
* **Frontend**: Vanilla HTML5, CSS3 Variables, ES6 JavaScript (Zero heavy framework overhead, extremely lightweight DOM rendering)
* **Backend**: Node.js & Express.js
* **Database**: MongoDB & Mongoose ORM
* **Security**: `bcryptjs` (Password Hashing), JSON Web Tokens (JWT)
* **Payment Gateway**: Stripe API

---

## 💻 Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/en/) (v16.x or newer)
* [MongoDB](https://www.mongodb.com/try/download/community) (Running locally via `mongod`)

### 2. Installation
Clone the repository and install the NPM dependencies:
```bash
git clone https://github.com/Ayush9874/fusion-star-ecommerce.git
cd fusion-star-ecommerce
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and copy the contents from `.env.example`:
```bash
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/fusion-star
JWT_SECRET=your_super_secret_jwt_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
```
*(Note: To test Stripe payments, you will need to retrieve a freely available test secret key from your Stripe Developer Dashboard).*

### 4. Database Seeding
You can populate your local MongoDB with realistic products and test users by running:
```bash
npm run seed
```

**Seed Credentials (Automatically generated):**
* **Admin Role:** `admin@fusionstar.com` | Password: `admin123`
* **Shopper Role:** `jane@example.com` | Password: `password123`

### 5. Running the Application
Start the development server (which uses `nodemon` for hot-reloading):
```bash
npm run dev
```
The application will be accessible at: **`http://localhost:5000`**

---

## 📚 API Endpoints Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| **POST** | `/api/auth/register` | Register a new user | Public |
| **POST** | `/api/auth/login` | Authenticate user & get token | Public |
| **GET** | `/api/products` | Fetch all products (supports queries) | Public |
| **GET** | `/api/cart` | Get current user's active cart | Private |
| **POST** | `/api/orders/checkout` | Create Stripe PaymentIntent | Private |
| **GET** | `/api/admin/stats` | Retrieve store metrics dashboard | Admin |
| **POST** | `/api/products` | Create a new product listing | Admin |
| **PUT** | `/api/admin/orders/:id/status` | Update shipping status | Admin |

*(See individual backend controllers for thorough request/response signatures).*

---
