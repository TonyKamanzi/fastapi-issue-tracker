# FastAPI Issue Tracker

A mini production-style REST API built with FastAPI for tracking issues. This project demonstrates core FastAPI concepts including routing, data validation with Pydantic, CRUD operations, and file-based persistence.

This is the project from my [FastAPI Crash Course](https://youtu.be/8TMQcRcBnW8)

## Features

- Full CRUD operations for issues
- Data validation with Pydantic schemas
- UUID generation for issue IDs
- Priority levels (low, medium, high)
- Status tracking (open, in_progress, closed)
- JSON file-based storage
- Auto-generated API documentation
- Custom middleware (timing, CORS)

## Requirements

- Python 3.9+

## Installation

1. Clone the repository:

```bash
git clone https://github.com/bradtraversy/fastapi-issue-tracker.git
cd fastapi-issue-tracker
```

2. Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install "fastapi[standard]"
```

## Running the API

Start the development server:

```bash
fastapi dev main.py
```

The API will be available at `http://localhost:8000`

## Configuration

Copy `.env.example` to `.env` and adjust as needed. `.env` is gitignored; do not commit it.

| Variable       | Required | Description                                                    |
| -------------- | -------- | -------------------------------------------------------------- |
| `CORS_ORIGINS` | no       | Comma-separated origins allowed to call the API cross-origin    |

Unset by default, which denies all cross-origin requests.

## API Documentation

Once running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| GET    | `/api/v1/health`          | Health check         |
| GET    | `/api/v1/issues`          | Get all issues       |
| GET    | `/api/v1/issues/{id}`     | Get issue by ID      |
| POST   | `/api/v1/issues`          | Create a new issue   |
| PUT    | `/api/v1/issues/{id}`     | Update an issue      |
| DELETE | `/api/v1/issues/{id}`     | Delete an issue      |

## Request/Response Examples

### Create an Issue

```bash
curl -X POST http://localhost:8000/api/v1/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "description": "Users cannot log in with special characters in password",
    "priority": "high"
  }'
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Fix login bug",
  "description": "Users cannot log in with special characters in password",
  "priority": "high",
  "status": "open"
}
```

### Update an Issue

```bash
curl -X PUT http://localhost:8000/api/v1/issues/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

## Middleware

This project includes custom middleware to demonstrate the middleware pattern in FastAPI.

### Timing Middleware

Adds an `X-Process-Time` header to all responses showing how long the request took to process:

```python
# app/middleware/timing.py
async def timing_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.4f}s"
    return response
```

### CORS Middleware

Cross-origin access is denied by default. Allowed origins come from the `CORS_ORIGINS` environment variable as a comma-separated list; when it is unset, `allow_origins` is empty and every cross-origin request is rejected:

```python
def allowed_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)
```

Set it only if a client needs to call this API directly from its own origin, for example during frontend development:

```bash
CORS_ORIGINS=http://localhost:3000
```

The frontend in this repository reverse-proxies the API through its own origin, so browser requests arrive same-origin and never need CORS. Swagger UI is served by this API and is same-origin with it, so it works with `CORS_ORIGINS` unset.

## Project Structure

```
fastapi-issue-tracker/
├── main.py              # Application entry point
├── app/
│   ├── schemas.py       # Pydantic models for validation
│   ├── storage.py       # JSON file storage functions
│   ├── middleware/
│   │   └── timing.py    # Response timing middleware
│   └── routes/
│       └── issues.py    # Issue CRUD endpoints
├── data/
│   └── issues.json      # Data storage (auto-created)
└── docs/
    ├── crash_course.md              # Written FastAPI tutorial
    └── crash_course_excalidraw.png  # Architecture diagram from video
```

## Documentation

The `docs` folder contains supplementary learning materials:

- **crash_course.md** - A written FastAPI crash course covering all the concepts used in this project
- **crash_course_excalidraw.png** - The Excalidraw architecture diagram from the YouTube video

## License

MIT
