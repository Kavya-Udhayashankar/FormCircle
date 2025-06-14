
# 🚀 FormCircle

A **real-time, consensus-driven collaborative form system** with live field editing, typing indicators, form locking, role-based dashboards, and complete user tracking. Built with **React.js (frontend)** and **Node.js/Express/Socket.IO (backend)**, and powered by **MySQL** with optional **Redis** for enhanced performance and scalability.

---

## 📁 Folder Structure

```
FormCircle/
├── backend/              # Express + Socket.IO backend
│   ├── config/           # MySQL & Redis configurations
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth and role-based access control
│   ├── routes/           # API endpoints
│   ├── sockets/          # WebSocket event handlers
│   ├── server.js         # Main backend server
│   └── package.json      # Backend dependencies
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # UI components (JoinForm, Dashboard, etc.)
│   │   ├── pages/        # Route-specific components (FormHistory, etc.)
│   │   ├── app.js        # App routing and main logic
│   │   └── index.js      # React entry point
│   └── package.json      # Frontend dependencies
│
└── README.md             # Project documentation
```

---

## ✨ Key Features

- **🔁 Real-Time Collaborative Editing** – Users see live field updates from others instantly.
- **👀 Typing Indicators** – Know who’s editing which field in real time.
- **🗳️ Consensus-Based Save** – All collaborators must agree before saving a form.
- **👮 Role-Based Dashboards** – Admins manage forms; users fill, view, and track.
- **🌐 Time Zone Consistency** – All timestamps are stored and displayed in **IST**.
- **🧠 User Session Tracking** – Handles refreshes, reconnects, and blocks spoofing.
- **📜 Form History** – Full history of responses per user/admin.
- **🧪 Field Validation** – Admin-defined rules; users get immediate feedback.

---

## ⚙️ Environment Setup

### 🔧 Backend `.env` (inside `backend/`)
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=formcircle
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
```

### 🌐 Frontend `.env` (inside `frontend/`)
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000
```

---

## 🏁 Installation & Running Locally

### 1️⃣ Clone the repository
```bash
git clone <repo-url>
cd FormCircle
```

### 2️⃣ Install Backend Dependencies
```bash
cd backend
npm install
```

### 3️⃣ Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4️⃣ Run the Backend
```bash
cd ../backend
node server.js
```

### 5️⃣ Run the Frontend
```bash
cd ../frontend
npm start
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:5000 (default port)

---

## 🏗️ Architecture & Design Decisions

### 🧩 Frontend (React)
- Component-based modular UI
- State management with React Hooks
- Routing using React Router
- Real-time socket updates via Socket.IO
- JWT decoding on the client

### 🏢 Backend (Node.js/Express)
- REST API for CRUD operations
- Socket.IO for real-time collaboration
- Middleware for auth and role validation
- Redis (optional) for in-memory collaboration state
- MySQL for persistent user/form data
- Scheduled Redis → MySQL syncing to ensure data durability

### 🧠 Why These Technologies?
- **Socket.IO**: Low-latency real-time communication.
- **React.js**: Seamless interactive UI.
- **Redis**: High-speed memory store for scalable real-time state.
- **date-fns-tz**: Precise timezone handling for IST coordination.

---

## ⚠️ Edge Cases & Robustness

- **Time Zone Conflicts**: All datetimes are parsed/stored/displayed in **IST** to maintain consistency.
- **Reconnect Logic**: User sessions persist on reload; socket reconnections are handled automatically.
- **Save Race Conditions**: Consensus-saving is strictly validated. A single “No” pauses saving and collects reasons.
- **Spoofing Prevention**: All real-time actions are authenticated via server-verified `userId`, not from the client.
- **Simultaneous Field Edits**: Uses **last-write-wins** for simplicity; future improvements can include optional locking.
- **Validation**: Fields have admin-configured constraints; users see instant inline error messages.

---

## ✅ Future Enhancements

- ✅ Advanced Analytics and reporting   
- ✅ Offline mode with auto-sync  
- ✅ Enhanced Role-based field-level permissions  
- ✅ Drag-and-drop form builder for admins  
- ✅ Notifications integration  

---
