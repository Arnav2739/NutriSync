from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, profile, workout, progress, diet, cheat_meal

app = FastAPI(
    title="NutriSync API",
    version="0.1.0",
    description="Backend API for NutriSync / FitWise AI"
)

# Enable CORS for React frontend (Vite default port 5173 / 8443)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8443",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "NutriSync Backend"}

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(profile.router, prefix="/api/v1")
app.include_router(workout.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1")
app.include_router(diet.router, prefix="/api/v1")
app.include_router(cheat_meal.router, prefix="/api/v1")

