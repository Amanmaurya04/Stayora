# Stayora 🏡

**Stayora** is a full-stack accommodation and experiences booking platform inspired by Airbnb. It allows users to discover and book stays, explore local experiences, manage reservations, and host their own properties and experiences.

Built using the **MERN stack**, Stayora includes JWT-based authentication, Cloudinary image uploads, and Razorpay payment integration.

## 🌐 Live Demo

- **Live Website:** [https://stayora-frontend-w40n.onrender.com](https://stayora-frontend-w40n.onrender.com)
- **Backend API:** [https://stayora-mznj.onrender.com](https://stayora-mznj.onrender.com)
- **GitHub Repository:** [https://github.com/Amanmaurya04/Stayora](https://github.com/Amanmaurya04/Stayora)

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
- Payment verification.
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

### Frontend
- React.js
- React Router
- Bootstrap
- CSS
- JavaScript
- Vite

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)

### Services & Integrations
- **Cloudinary** – Image storage and management
- **Razorpay** – Payment gateway integration

### Development Tools
- Git & GitHub
- VS Code
- Postman
- npm

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

Open another terminal from the project root:

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` directory and add:

```env
PORT=8000
Mongo_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

CLIENT_URL=http://localhost:5173
```

Create another `.env` file inside the `client` directory:

```env
VITE_API_URL=http://localhost:8000
```

**Important:** Replace the placeholder values with your own credentials. Never commit actual API keys, passwords, or secret values to GitHub.

### 5. Run the backend

From the `server` directory:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:8000
```

### 6. Run the frontend

Open another terminal and navigate to the `client` directory:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:5173
```

## 🚀 Deployment

Stayora is deployed using **Render**.

- Frontend: Render Static Site
- Backend: Render Web Service
- Database: MongoDB Atlas
- Image Storage: Cloudinary
- Payments: Razorpay

## 🔮 Future Improvements

- Advanced search and filtering.
- Wishlist functionality.
- Enhanced booking and hosting dashboard.
- Improved notifications and booking updates.
- Additional performance and security optimizations.

## 👨‍💻 Author

**Aman Mourya**

- GitHub: [@Amanmaurya04](https://github.com/Amanmaurya04)

---

⭐ If you find this project interesting, consider giving the repository a star!