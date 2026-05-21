# Enterprise Knowledge Base Management System

A full-stack enterprise web application for centralized knowledge management — Phase 1.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python FastAPI |
| Database | PostgreSQL |
| Auth | JWT (python-jose) + bcrypt |
| ORM | SQLAlchemy 2.0 |

---

## Project Structure

```
Enterprise-Knowledge-Base-Mgmt-System/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── models/           # SQLAlchemy DB models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routers/          # API route handlers
│   │   ├── core/             # Security (JWT, bcrypt) + dependencies
│   │   ├── main.py           # App entry point, CORS, startup
│   │   ├── config.py         # Environment config
│   │   └── database.py       # DB engine + session
│   ├── uploads/              # Uploaded file storage
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
└── frontend/                 # React frontend
    └── src/
        ├── pages/            # 15 application pages
        ├── components/       # Reusable UI components
        ├── services/         # Axios API service layer
        └── context/          # Auth context (JWT state)
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE knowledge_base_db;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/knowledge_base_db
SECRET_KEY=your-secret-key-minimum-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

Start the backend:

```bash
python run.py
```

The API will be available at: `http://localhost:8000`  
Interactive API docs (Swagger): `http://localhost:8000/docs`  
Alternative docs (ReDoc): `http://localhost:8000/redoc`

> On first startup, all database tables are created automatically and a default admin account is seeded.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at: `http://localhost:5173`

---

## Default Admin Account

| Field | Value |
|---|---|
| Email | admin@company.com |
| Password | Admin@123 |
| Role | Administrator |

> Change this password immediately after first login in production.

---

## User Roles

| Role | Permissions |
|---|---|
| **Admin** | Full system access — users, categories, analytics, all articles |
| **Author** | Create & manage own articles, submit for approval |
| **Reviewer** | Review and approve/reject submitted articles |
| **Employee** | Search, read published articles, bookmark, rate, comment |

---

## Application Screens

| Screen | Route | Access |
|---|---|---|
| Login | `/login` | Public |
| Register | `/register` | Public |
| Dashboard | `/dashboard` | All roles |
| Knowledge Articles | `/articles` | All roles |
| Article Detail | `/articles/:id` | All roles |
| Create Article | `/articles/create` | Author, Admin |
| Edit Article | `/articles/:id/edit` | Author (own), Admin |
| My Articles | `/my-articles` | Author, Admin |
| Approval Queue | `/approvals` | Reviewer, Admin |
| Search | `/search` | All roles |
| Categories | `/categories` | Admin only |
| Tags | `/tags` | All roles |
| User Management | `/users` | Admin only |
| Analytics | `/analytics` | Admin only |
| Profile | `/profile` | All roles |
| Bookmarks | `/bookmarks` | All roles |

---

## API Endpoints Summary

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | POST /register, /login, /forgot-password |
| Users | `/api/users` | GET /me, CRUD (admin) |
| Articles | `/api/articles` | Full CRUD + submit/publish/archive |
| Categories | `/api/categories` | CRUD (admin) |
| Tags | `/api/tags` | CRUD |
| Search | `/api/search` | GET /?q=&category_id=&tag_id=&sort= |
| Files | `/api/files` | POST /upload, GET /{id}, DELETE /{id} |
| Approvals | `/api/approvals` | GET /pending, POST /{id}/approve|reject |
| Collaboration | `/api/collaboration` | Comments, ratings, bookmarks |
| Analytics | `/api/analytics` | Dashboard, popular, trends |

---

## Article Lifecycle

```
Draft → Pending Approval → Approved → Published
                        ↘ Rejected → (Author revises) → Pending Approval
Published → Archived
```

---

## Supported File Types (Uploads)

PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, PNG, JPG/JPEG  
Maximum file size: **10 MB**

---

## Key Features

- **Role-Based Access Control** — route and API level enforcement
- **Article Approval Workflow** — full audit trail with reviewer comments
- **Rich Text Editor** — Quill.js with formatting toolbar
- **Full-Text Search** — keyword search across title, description, content with category/tag filters
- **File Management** — upload, download, and attach multiple files per article
- **Collaboration** — threaded comments, 1–5 star ratings, bookmarks
- **Analytics Dashboard** — article counts, view stats, category distribution, search trends (Recharts)
- **Hierarchical Categories** — parent/child category relationships
- **Responsive Design** — Tailwind CSS, mobile-friendly sidebar drawer
