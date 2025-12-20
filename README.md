# 🎓 EduConnect - Collaborative Learning Platform

> A modern, real-time collaborative learning management system built with React, Node.js, and WebSocket technology.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://edu-connect-hazel.vercel.app/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**🚀 Live Demo:** [https://edu-connect-hazel.vercel.app/](https://edu-connect-hazel.vercel.app/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 👨‍🏫 For Instructors
- **Assignment Management**: Create individual and group assignments with due dates
- **Real-time Polls**: Create and manage interactive polls with live results
- **Submission Tracking**: View and manage student submissions
- **Edit Control**: Toggle assignment editability on/off
- **Analytics Dashboard**: Track student engagement and progress

### 👨‍🎓 For Students
- **Assignment Submission**: Submit assignments with file uploads and descriptions
- **Interactive Polls**: Participate in real-time voting
- **Notifications**: Receive instant notifications for new assignments and updates
- **Collaborative Rooms**: Work together on group assignments

### 🔄 Real-time Features
- **Live Notifications**: Socket.io powered instant updates
- **Collaborative Editing**: Real-time document collaboration using Y.js
- **Video Calling**: Built-in PeerJS video conferencing
- **Real-time Chat**: WebSocket-based messaging system

### 🔐 Security
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Student, Instructor, and TA roles
- **Password Hashing**: Bcrypt password encryption
- **Protected Routes**: Middleware-based route protection

---

## 🛠 Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Socket.io Client** - Real-time communication
- **Y.js** - CRDT for collaborative editing
- **PeerJS** - WebRTC video calls
- **React Router** - Client-side routing
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **WebSocket (ws)** - Y.js collaboration
- **JWT** - Authentication
- **Bcrypt.js** - Password hashing

### Deployment
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chaitanya2139/EduConnect.git
   cd EduConnect
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   
   Create `.env` file in the `server` folder:
   ```env
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/educonnect
   JWT_SECRET=your_jwt_secret_here
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

   Create `.env` file in the `client` folder:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_WS_URL=ws://localhost:3001
   VITE_SOCKET_URL=http://localhost:3001
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Run the backend**
   ```bash
   cd server
   npm run dev
   ```

7. **Run the frontend**
   ```bash
   cd client
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

---

## 🔑 Environment Variables

### Backend (`server/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/educonnect` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_secret_key` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Frontend (`client/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:3001` |
| `VITE_SOCKET_URL` | Socket.io URL | `http://localhost:3001` |

---

## 🌐 Deployment

### Quick Deployment Guide

The project is configured for easy deployment to Vercel (frontend) and Render (backend).


### Current Deployment
- **Frontend**: [https://edu-connect-hazel.vercel.app/](https://edu-connect-hazel.vercel.app/)
- **Backend**: Render
- **Database**: MongoDB Atlas

---

## 📁 Project Structure

```
EduConnect/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── config.js      # Configuration
│   │   └── main.jsx       # Entry point
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Backend Node.js application
│   ├── routes/           # API routes
│   ├── models/           # Mongoose models
│   ├── config/           # Configuration files
│   ├── index.js          # Server entry point
│   └── package.json
│
└── README.md            # This file
```

---

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Assignments
- `GET /api/assignments` - Get all assignments
- `POST /api/assignments` - Create assignment (Instructor only)
- `POST /api/assignments/:id/submit` - Submit assignment (Student)
- `GET /api/assignments/:id/submissions` - Get submissions (Instructor)
- `PATCH /api/assignments/:id/editability` - Toggle editability
- `DELETE /api/assignments/:id` - Delete assignment

### Polls
- `GET /api/polls` - Get all polls
- `POST /api/polls` - Create poll (Instructor only)
- `POST /api/polls/:id/vote` - Vote on poll

### Notifications
- `GET /api/notifications` - Get user notifications

---

## 👥 User Roles

### Student
- View and submit assignments
- Participate in polls
- Receive notifications
- Join collaborative rooms

### Instructor
- Create and manage assignments
- Create and manage polls
- View submissions
- Control assignment settings

### Teaching Assistant (TA)
- View assignments and submissions
- Assist with grading
- Monitor student progress

---

## 🔒 Security Features

- JWT-based authentication with 7-day expiration
- Password hashing using bcrypt (10 rounds)
- Role-based access control middleware
- CORS protection
- Environment variable protection
- HTTPS in production

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Chaitanya Awasthi**
- GitHub: [@Chaitanya2139](https://github.com/Chaitanya2139)
- Live Demo: [EduConnect](https://edu-connect-hazel.vercel.app/)

---

## 🙏 Acknowledgments

- React Team for the amazing framework
- MongoDB team for the database
- Vercel and Render for hosting
- Y.js for collaborative editing
- Socket.io for real-time features

---

## 📞 Support

If you have any questions or need help, please:
1. Check existing [Issues](https://github.com/Chaitanya2139/EduConnect/issues)
2. Create a new issue with detailed description
3. Contact via GitHub discussions

---

<div align="center">
  <p>Made with ❤️ for better education</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
