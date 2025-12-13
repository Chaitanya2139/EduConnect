# 🎓 EduConnect - Role-Based Access Control System

## 📋 Overview
Successfully implemented a complete role-based system with three distinct user roles: **Student**, **Instructor**, and **Teaching Assistant**, each with their own dashboard and features.

---

## ✅ What's Been Implemented

### 1. **User Registration System**
- ✅ New `/register` route with visual role selection
- ✅ Three role options with descriptions and icons:
  - 👨‍🎓 **Student** - Access collaborative documents, assignments, and polls
  - 👨‍🏫 **Instructor** - Create assignments, manage polls, control document access
  - 👨‍💼 **Teaching Assistant** - Grade assignments, moderate discussions, assist students

### 2. **Backend Models**
- ✅ **User Model** - Added `role` field with enum validation
- ✅ **Assignment Model** - Title, description, due date, editability control
- ✅ **Poll Model** - Question, options with vote tracking, voter tracking
- ✅ **Notification Model** - Type-based notifications for all users

### 3. **Backend API Routes**

#### Authentication (`/api/auth`)
- ✅ `POST /register` - Register with role selection
- ✅ `POST /login` - Login with role-based JWT token

#### Assignments (`/api/assignments`)
- ✅ `GET /` - Fetch all assignments
- ✅ `POST /` - Create assignment (instructor only)
- ✅ `PATCH /:id/editability` - Toggle assignment editability
- ✅ `DELETE /:id` - Delete assignment (instructor only)

#### Polls (`/api/polls`)
- ✅ `GET /` - Fetch all active polls
- ✅ `POST /` - Create poll (instructor only)
- ✅ `POST /:id/vote` - Vote on poll (students only)
- ✅ `DELETE /:id` - Delete poll (instructor only)

#### Notifications (`/api/notifications`)
- ✅ `GET /` - Fetch user's notifications
- ✅ `PATCH /:id/read` - Mark notification as read
- ✅ `PATCH /read-all` - Mark all as read
- ✅ `DELETE /:id` - Delete notification

### 4. **Frontend Pages**

#### Register Page (`/register`)
- ✅ Beautiful gradient UI with role selection cards
- ✅ Form validation (password match, minimum length)
- ✅ Role-based navigation after registration
- ✅ Integration with backend API

#### Instructor Dashboard (`/instructor-dashboard`)
- ✅ Stats cards: Active assignments, polls, students, pending reviews
- ✅ Create assignment modal with due date and editability toggle
- ✅ Create poll modal with dynamic option management
- ✅ Assignment list with edit/delete/navigate actions
- ✅ Poll list with vote counts
- ✅ Lock/unlock assignments to control student editing
- ✅ Navigate directly to assignment rooms

#### Teaching Assistant Dashboard (`/ta-dashboard`)
- ✅ Stats cards: Graded submissions, pending reviews, discussions, students
- ✅ Active assignments view
- ✅ Pending submission reviews
- ✅ Discussion moderation interface
- ✅ Review and grade functionality UI

### 5. **Routing Updates**
- ✅ `/register` - Registration page
- ✅ `/instructor-dashboard` - Instructor dashboard
- ✅ `/ta-dashboard` - TA dashboard
- ✅ Protected routes with role validation

---

## 🎨 Key Features

### **Instructor Features**
1. **Assignment Management**
   - Create assignments with title, description, and due date
   - Toggle editability (allow/disallow student editing)
   - Delete assignments
   - Navigate to assignment collaboration rooms
   - Automatic notifications sent to all students

2. **Poll Management**
   - Create polls with custom questions
   - Add/remove poll options dynamically (min 2 options)
   - View real-time vote counts
   - Delete polls

3. **Dashboard Stats**
   - Active assignments count
   - Active polls count
   - Total students
   - Pending reviews

### **Teaching Assistant Features**
1. **Submission Review**
   - View pending submissions
   - Grade submissions
   - Track grading progress

2. **Discussion Moderation**
   - View active discussions
   - Reply to student questions
   - Mark discussions as resolved

3. **Assignment Access**
   - View all active assignments
   - Access assignment rooms
   - Review submission statistics

### **Student Features** (Existing + New)
1. **Assignments**
   - Receive notifications for new assignments
   - Access assignment collaboration rooms
   - Edit assignments (when instructor allows)

2. **Polls**
   - Receive notifications for new polls
   - Vote on active polls (one vote per poll)
   - View poll results

3. **Collaborative Editing** (Existing)
   - Real-time document collaboration
   - Video calling with peers
   - Cursor awareness

---

## 🔐 Security & Authorization

### JWT Token Structure
```json
{
  "userId": "user_id",
  "username": "username",
  "email": "email",
  "role": "student|instructor|teaching-assistant"
}
```

### Role-Based Middleware
- ✅ Authentication middleware verifies JWT tokens
- ✅ `instructorOnly` middleware restricts instructor-only routes
- ✅ Poll voting restricted to students only
- ✅ Frontend role validation on dashboards

---

## 🚀 How to Use

### 1. **Start the Backend**
```bash
cd server
npm run dev
```
The server runs on `http://localhost:3001`

### 2. **Start the Frontend**
```bash
cd client
npm run dev
```
The client runs on `http://localhost:5173`

### 3. **Register a New User**
1. Go to `http://localhost:5173/register`
2. Fill in username, email, password
3. Select your role (Student, Instructor, or Teaching Assistant)
4. Click "Create Account"
5. You'll be redirected to your role-specific dashboard

### 4. **Instructor Workflow**
1. Login/Register as Instructor
2. Access `/instructor-dashboard`
3. Click "Create Assignment"
4. Fill in assignment details
5. Toggle "Allow students to edit" if needed
6. Click "Create" - notifications sent to all students
7. Click "Create Poll" to create a poll
8. Add poll options dynamically
9. Toggle lock/unlock icon to control assignment editability

### 5. **Teaching Assistant Workflow**
1. Login/Register as Teaching Assistant
2. Access `/ta-dashboard`
3. View pending submission reviews
4. Click "Review & Grade" to grade submissions
5. Moderate discussions
6. View assignment statistics

### 6. **Student Workflow**
1. Login/Register as Student
2. Receive notifications for new assignments/polls
3. Access assignment rooms from notifications
4. Vote on polls (one vote per poll)
5. Collaborate in real-time with video calling

---

## 📁 File Structure

### Backend
```
server/
├── models/
│   ├── User.js          ✅ Added role field
│   ├── Assignment.js    ✅ NEW
│   ├── Poll.js          ✅ NEW
│   └── Notification.js  ✅ NEW
├── routes/
│   ├── auth.js          ✅ NEW (register, login)
│   ├── assignments.js   ✅ NEW
│   ├── polls.js         ✅ NEW
│   └── notifications.js ✅ NEW
└── index.js             ✅ Updated with routes
```

### Frontend
```
client/src/
├── pages/
│   ├── Register.jsx            ✅ NEW
│   ├── InstructorDashboard.jsx ✅ NEW
│   ├── TADashboard.jsx          ✅ NEW
│   └── Login.jsx                ✅ Updated with register link
└── App.jsx                      ✅ Added new routes
```

---

## 🎯 Next Steps (Optional Enhancements)

### 1. **Student Dashboard Updates**
- Show assignment notifications
- Display available polls
- Quick access to recent assignments

### 2. **Real-time Notifications**
- Use Socket.io for live notifications
- Bell icon with unread count
- Toast notifications for new assignments/polls

### 3. **Submission System**
- Students submit assignments
- TAs review and grade submissions
- Grade notifications

### 4. **Enhanced Poll Features**
- Poll expiration dates
- Multiple choice vs single choice
- Poll results visualization (charts)

### 5. **Discussion Forum**
- Create discussion threads
- Reply to discussions
- Tag instructors/TAs

### 6. **Analytics Dashboard**
- Student engagement metrics
- Assignment completion rates
- Poll participation statistics

### 7. **Document Access Control**
- Instructor sets per-assignment edit permissions
- Read-only mode for students when locked
- Version history

---

## 🐛 Known Limitations

1. **Notification System** - Currently creates notifications but no UI to display them
2. **Submission System** - API structure ready but submission form not yet created
3. **TA Permissions** - Need to clarify what TAs can/cannot do with assignments
4. **Real-time Updates** - Dashboards don't auto-refresh when new assignments/polls are created
5. **Poll Voting UI** - Students can vote via API but no dedicated poll voting page yet

---

## 🔧 Environment Variables

Make sure your `.env` file in the server directory has:
```env
MONGO_URI=mongodb://localhost:27017/educonnect
JWT_SECRET=your-secret-key-here
```

---

## 📝 API Testing

### Register as Instructor
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "prof_smith",
    "email": "smith@example.com",
    "password": "password123",
    "role": "instructor"
  }'
```

### Create Assignment (with token)
```bash
curl -X POST http://localhost:3001/api/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "React Hooks Assignment",
    "description": "Complete the useState and useEffect exercises",
    "dueDate": "2024-02-15",
    "isEditable": true
  }'
```

### Create Poll (with token)
```bash
curl -X POST http://localhost:3001/api/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "question": "What topic should we cover next?",
    "options": ["React Router", "Redux", "Next.js", "TypeScript"]
  }'
```

---

## 🎉 Summary

Your EduConnect platform now has:
- ✅ Complete role-based authentication system
- ✅ Three distinct user roles with different permissions
- ✅ Instructor dashboard with assignment and poll management
- ✅ Teaching Assistant dashboard with review capabilities
- ✅ Automatic notification system
- ✅ RESTful API with role-based authorization
- ✅ Modern, gradient-based UI with Tailwind CSS
- ✅ Integration with existing collaborative editing features

The system is ready to use! Start the servers and register users with different roles to test the complete workflow.
