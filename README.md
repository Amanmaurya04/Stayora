# Stayora 🏡

**Stayora** is a full-stack accommodation and experiences booking platform inspired by Airbnb. It allows users to discover and book stays, explore local experiences, manage reservations, and host their own properties and experiences.

The project is built using the MERN stack with secure authentication, image uploads, and Razorpay payment integration.

## ✨ Features

### 🏠 Accommodation Listings
- Browse available properties.
- View detailed property information and images.
- Create, edit, and manage property listings.
- Upload and manage property images using Cloudinary.

### 🎯 Experiences
- Explore experiences across different categories.
- Create and manage experiences.
- Add and edit experience schedules and available slots.
- Manage available spots for each scheduled session.

### 📅 Booking Management
- Book accommodations and experiences.
- View personal bookings.
- Manage hosted property and experience bookings.
- Cancel eligible reservations.
- Track booking and payment statuses.

### 💳 Payment Integration
- Razorpay payment gateway integration.
- Secure payment verification.
- Booking payment status management.

### 🔐 Authentication & User Management
- User registration and login.
- JWT-based authentication.
- Protected routes and authorization.
- User profile management.
- Password reset functionality.

### ⭐ Reviews & Ratings
- Submit reviews for stays and experiences.
- Accommodation ratings across multiple categories.
- Experience reviews and ratings.

## 🛠️ Tech Stack

**Frontend**
- React.js
- React Router
- Bootstrap
- CSS
- JavaScript

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)

**Services & Integrations**
- Cloudinary – Image storage and management
- Razorpay – Payment integration

**Development Tools**
- Git & GitHub
- VS Code
- Vite
- Postman

## 📂 Project Structure

```text
Stayora/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites

- Node.js
- npm
- MongoDB
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Amanmaurya04/Stayora.git
cd Stayora
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory.

Add the required configuration:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Make sure to use your actual environment variable names from your backend configuration.

### 5. Run the backend

```bash
cd server
npm run dev
```

### 6. Run the frontend

In another terminal:

```bash
cd client
npm run dev
```

The application should now be available at:

```text
http://localhost:5173
```

The backend runs on:

```text
http://localhost:8000
```

## 🚀 Future Improvements

- Responsive UI improvements.
- Advanced search and filtering.
- Wishlist functionality.
- Enhanced booking and hosting dashboard.
- Deployment and production optimization.

## 👨‍💻 Author

**Aman Mourya**

- GitHub: [@Amanmaurya04](https://github.com/Amanmaurya04)

---

⭐ If you find this project interesting, consider giving it a star!