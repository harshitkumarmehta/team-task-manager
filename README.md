# Team Task Manager

Full-stack task management app with role-based access (Admin/Member).

## Stack
- **Backend**: Node.js + Express + PostgreSQL + JWT
- **Frontend**: React (Vite) + plain CSS

---

## Setup

### 1. Database

Create a PostgreSQL database:
```
createdb taskmanager
psql -U postgres -d taskmanager -f server/db/schema.sql
```

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
npm install
npm run dev
```

Server runs on http://localhost:5000

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Client runs on http://localhost:5173

---

## File Structure

```
team-task-manager/
├── server/
│   ├── index.js                  # Express entry point
│   ├── .env.example
│   ├── package.json
│   ├── db/
│   │   ├── db.js                 # PostgreSQL pool
│   │   └── schema.sql            # Tables: users, projects, project_members, tasks
│   ├── middleware/
│   │   └── auth.js               # JWT auth + adminOnly guard
│   ├── controllers/
│   │   ├── authController.js     # signup, login
│   │   ├── projectController.js  # CRUD + member management
│   │   ├── taskController.js     # CRUD + status update
│   │   └── dashboardController.js# stats, all users
│   └── routes/
│       ├── auth.js
│       ├── projects.js
│       ├── tasks.js
│       └── dashboard.js
│
└── client/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx               # Routes + auth guards
        ├── api.js                # fetch wrapper
        ├── context/
        │   └── AuthContext.jsx   # user state + localStorage
        ├── components/
        │   ├── Layout.jsx        # Sidebar + main wrapper
        │   └── Layout.css
        ├── pages/
        │   ├── Login.jsx / Auth.css
        │   ├── Signup.jsx
        │   ├── Dashboard.jsx / Dashboard.css
        │   ├── Projects.jsx / Projects.css
        │   └── ProjectDetail.jsx / ProjectDetail.css
        └── styles/
            └── global.css
```

---

## API Endpoints

| Method | Path | Access |
|--------|------|--------|
| POST | /api/auth/signup | Public |
| POST | /api/auth/login | Public |
| GET | /api/projects | Auth |
| POST | /api/projects | Admin |
| PUT | /api/projects/:id | Admin |
| DELETE | /api/projects/:id | Admin |
| GET | /api/projects/:id/members | Auth |
| POST | /api/projects/:id/members | Admin |
| DELETE | /api/projects/:id/members/:userId | Admin |
| GET | /api/tasks/project/:id | Auth |
| POST | /api/tasks | Admin |
| PATCH | /api/tasks/:id/status | Auth |
| DELETE | /api/tasks/:id | Admin |
| GET | /api/dashboard/stats | Auth |
| GET | /api/dashboard/users | Admin |
