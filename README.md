# Team Task Manager

A full-stack web app where teams can manage projects and tasks with role-based access. Built as part of a company assignment.

**Live:** https://team-task-manager-production-a0dd.up.railway.app  
**GitHub:** https://github.com/harshitkumarmehta/team-task-manager

---

## What it does

There are two roles — Admin and Member. They have different levels of access.

**Admin can:**

- Create, edit and delete projects
- Add or remove members from a project
- Create tasks and assign them to members
- Set priority (low, medium, high) and due dates
- See the full dashboard with all stats

**Member can:**

- View only the projects they've been added to
- Update the status of tasks assigned to them (To Do → In Progress → Done)
- See their own task dashboard

If a task's due date passes and it's still not done, it shows up as overdue on the dashboard. That's automatic, no manual flagging needed.

---

## Tech stack

**Backend**

- Node.js + Express
- PostgreSQL (raw SQL, no ORM)
- JWT for auth, bcrypt for passwords

**Frontend**

- React (Vite)
- Plain CSS — no Tailwind, no component libraries

**Deployed on Railway** — both the server and database run there.

---

## Running it locally

You'll need Node.js and PostgreSQL installed.

**1. Clone the repo**

```bash
git clone https://github.com/harshitkumarmehta/team-task-manager.git
cd team-task-manager
```

**2. Set up the database**

```bash
psql -U postgres -c "CREATE DATABASE taskmanager;"
psql -U postgres -d taskmanager -f server/db/schema.sql
```

**3. Configure the server**

```bash
cd server
cp .env.example .env
```

Open `.env` and fill in:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/taskmanager
JWT_SECRET=any_random_string
PORT=5000
```

**4. Start the backend**

```bash
npm install
npm run dev
```

**5. Start the frontend**

```bash
cd ../client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## API endpoints

| Method | Route                             | Who can use it |
| ------ | --------------------------------- | -------------- |
| POST   | /api/auth/signup                  | Public         |
| POST   | /api/auth/login                   | Public         |
| GET    | /api/projects                     | Admin + Member |
| POST   | /api/projects                     | Admin only     |
| DELETE | /api/projects/:id                 | Admin only     |
| GET    | /api/projects/:id/members         | Admin + Member |
| POST   | /api/projects/:id/members         | Admin only     |
| DELETE | /api/projects/:id/members/:userId | Admin only     |
| GET    | /api/tasks/project/:id            | Admin + Member |
| POST   | /api/tasks                        | Admin only     |
| PATCH  | /api/tasks/:id/status             | Admin + Member |
| DELETE | /api/tasks/:id                    | Admin only     |
| GET    | /api/dashboard/stats              | Admin + Member |
| GET    | /api/dashboard/users              | Admin only     |

---

## Folder structure

```
team-task-manager/
├── server/
│   ├── index.js
│   ├── db/
│   │   ├── schema.sql
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── dashboardController.js
│   └── routes/
│       ├── auth.js
│       ├── projects.js
│       ├── tasks.js
│       └── dashboard.js
└── client/
    └── src/
        ├── App.jsx
        ├── api.js
        ├── context/AuthContext.jsx
        ├── components/Layout.jsx
        └── pages/
            ├── Login.jsx
            ├── Signup.jsx
            ├── Dashboard.jsx
            ├── Projects.jsx
            └── ProjectDetail.jsx
```

---

Built by [Harshit Kumar Mehta](https://github.com/harshitkumarmehta)
