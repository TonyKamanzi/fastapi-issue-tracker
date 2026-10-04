# FastAPI Issue Tracker

A full-stack issue tracking application built with a FastAPI backend and a Next.js frontend. The project is designed as a learning project for building a production-style REST API and a small dashboard for interacting with it.

This repository combines:
- Backend API for managing issues
- Frontend interface for browsing, creating, editing, and deleting issues
- A simple workflow for local development and testing

## Tech Stack

- Backend: FastAPI, Pydantic, Python
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Storage: JSON file-based persistence
- API Docs: Swagger UI / ReDoc

## Features

- Full CRUD for issues
- Issue priority levels: low, medium, high
- Issue status tracking: open, in_progress, closed
- JSON file-based persistence
- Auto-generated API documentation
- Home dashboard with issue stats and filters
- Report, edit, and delete flows from the UI
- Health check endpoint

## Repository Structure

```bash
fastapi-issue-tracker/
├── backend/
│   ├── app/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── schemas.py
│   │   ├── storage.py
│   │   └── __init__.py
│   ├── docs/
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── app/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   └── README.md
├── .gitignore
├── LICENSE
└── README.md
```

## Prerequisites

Before running the project, make sure you have installed:

- Python 3.9+
- Node.js 18+
- npm

## Backend Setup

1. Open a terminal and change into the backend folder:

```bash
cd backend
```

2. Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate
```

3. Install the dependencies:

```bash
pip install -r requirements.txt
```

4. Start the API server:

```bash
fastapi dev main.py
```

5. Open the API docs in your browser:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Frontend Setup

1. Open a new terminal and go to the frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the frontend app:

```bash
npm run dev
```

4. Open the app in your browser:

- http://localhost:3000

## Environment Configuration

By default, the frontend connects to:

```bash
http://localhost:8000
```

If needed, you can override it with an environment variable:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Example:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
```

## API Endpoints

### Health

- `GET /api/v1/health`

### Issues

- `GET /api/v1/issues`
- `GET /api/v1/issues/{id}`
- `POST /api/v1/issues`
- `PUT /api/v1/issues/{id}`
- `DELETE /api/v1/issues/{id}`

## Example Request

Create a new issue:

```bash
curl -X POST http://localhost:8000/api/v1/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login issue",
    "description": "Users cannot log in with special characters in password",
    "priority": "high"
  }'
```

## Notes

- The backend stores issue data in a local JSON file.
- The frontend is designed to work with the FastAPI backend without mocks.
- The app is a practical example for learning REST API design, validation, and UI integration.

## License

This project is available under the MIT license.

## Credits

This project is based on a FastAPI crash course and was extended with a frontend dashboard for issue tracking.
