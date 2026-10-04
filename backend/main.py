import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.middleware.timing import timing_middleware
from app.routes.issues import router as issues_router


def allowed_origins() -> list[str]:
    """
    Cross-origin origins permitted to call the API, read from `CORS_ORIGINS`.

    Accepts a comma-separated list, e.g.
    `CORS_ORIGINS=https://my-app.vercel.app,http://localhost:3000`.
    Blank entries are ignored so a trailing comma is harmless.

    Defaults to an empty list, which denies every cross-origin request. The
    frontend reverse-proxies the API through its own origin, so a browser
    request arrives same-origin and CORS is not exercised at all. This is
    therefore a second line of defence rather than a functional requirement.
    """
    raw = os.getenv("CORS_ORIGINS", "")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app = FastAPI(
    title="Issue Tracker API",
    version="0.1.0",
    description="A mini production-style API built with FastAPI",
)

app.middleware("http")(timing_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    # The API is token-free and cookie-free, so credentials are never needed.
    # Allowing them alongside a wildcard origin is also rejected by browsers.
    allow_credentials=False,
    # Only the verbs the issues router actually serves.
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}


app.include_router(issues_router)
