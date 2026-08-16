from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection

from app.routes.auth_routes import router as auth_router
from app.routes.diet_routes import router as diet_router
from app.routes.fitness_routes import router as fitness_router
from app.routes.nutrition_routes import router as nutrition_router
from app.routes.bmi_routes import router as bmi_router
from app.routes.sleep_routes import router as sleep_router
from app.routes.goal_routes import router as goal_router
from app.routes.profile_routes import router as profile_router
from app.routes.health_risk_routes import router as health_risk_router
from app.routes.progress_report_routes import router as progress_report_router

app = FastAPI(
    title="FitLife API",
    description="Backend API for FitLife AI Health and Fitness Assistant",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(diet_router)
app.include_router(fitness_router)
app.include_router(nutrition_router)
app.include_router(bmi_router)
app.include_router(sleep_router)
app.include_router(goal_router)
app.include_router(profile_router)
app.include_router(health_risk_router)
app.include_router(progress_report_router)

@app.on_event("startup")
def startup_event():
    connect_to_mongo()


@app.on_event("shutdown")
def shutdown_event():
    close_mongo_connection()


@app.get("/")
def root():
    return {
        "message": "FitLife Backend API is running",
        "database": "MongoDB",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "Backend connected successfully",
    }