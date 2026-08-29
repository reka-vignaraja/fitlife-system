from datetime import datetime, timedelta, timezone
import os

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.database.mongodb import get_database


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)

security = HTTPBearer()


ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@fitlife.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fitlife-admin-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


class AdminLoginRequest(BaseModel):
    email: str
    password: str


def create_admin_token():
    expire = datetime.now(timezone.utc) + timedelta(hours=6)

    payload = {
        "sub": "fitlife_admin",
        "role": "admin",
        "exp": expire,
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials

        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        if payload.get("role") != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required.",
            )

        return payload

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired admin token.",
        )


def safe_str(value, default="Not set"):
    if value is None:
        return default

    value = str(value).strip()

    if value == "":
        return default

    return value


def format_date(value):
    if not value:
        return "Not set"

    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")

    return str(value)


def get_user_profile(db, user_id):
    user_id_text = str(user_id)

    profile = db["profiles"].find_one({"user_id": user_id_text})

    if profile:
        return profile

    try:
        profile = db["profiles"].find_one({"user_id": ObjectId(user_id_text)})
        if profile:
            return profile
    except Exception:
        pass

    return {}


def user_display_name(user, profile):
    first_name = safe_str(user.get("first_name"), "")
    last_name = safe_str(user.get("last_name"), "")

    full_from_parts = f"{first_name} {last_name}".strip()

    return (
        safe_str(profile.get("full_name"), "")
        or safe_str(profile.get("fullName"), "")
        or safe_str(user.get("full_name"), "")
        or safe_str(user.get("fullName"), "")
        or safe_str(user.get("name"), "")
        or full_from_parts
        or "FitLife User"
    )


@router.post("/login")
def admin_login(data: AdminLoginRequest):
    email = data.email.strip().lower()
    password = data.password.strip()

    if email != ADMIN_EMAIL.lower() or password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=401,
            detail="Invalid admin email or password.",
        )

    token = create_admin_token()

    return {
        "success": True,
        "message": "Admin login successful.",
        "token": token,
        "admin": {
            "email": ADMIN_EMAIL,
            "role": "admin",
        },
    }


@router.get("/verify")
def verify_admin_token(admin=Depends(get_current_admin)):
    return {
        "success": True,
        "message": "Admin token is valid.",
        "admin": {
            "email": ADMIN_EMAIL,
            "role": admin.get("role"),
        },
    }


@router.get("/stats")
def get_admin_stats(admin=Depends(get_current_admin)):
    db = get_database()

    def count_collection(collection_name):
        try:
            return db[collection_name].count_documents({})
        except Exception:
            return 0

    try:
        verified_users = db["users"].count_documents(
            {
                "$or": [
                    {"is_verified": True},
                    {"email_verified": True},
                    {"emailVerified": True},
                ]
            }
        )
    except Exception:
        verified_users = 0

    return {
        "success": True,
        "stats": {
            "registered_users": count_collection("users"),
            "verified_users": verified_users,
            "health_predictions": count_collection("health_risk_predictions"),
            "progress_reports": count_collection("progress_reports"),
            "diet_plans": count_collection("diet_plans"),
            "fitness_plans": count_collection("fitness_plans"),
            "sleep_records": count_collection("sleep_records"),
            "nutrition_logs": count_collection("nutrition_logs"),
            "goals": count_collection("goals"),
        },
    }


@router.get("/users")
def get_admin_users(admin=Depends(get_current_admin)):
    db = get_database()

    users = []

    cursor = db["users"].find(
        {},
        {
            "password": 0,
            "hashed_password": 0,
            "otp": 0,
            "otp_code": 0,
            "reset_token": 0,
        },
    ).sort("_id", -1).limit(100)

    for user in cursor:
        user_id = str(user.get("_id"))
        profile = get_user_profile(db, user_id)

        verified = bool(
            user.get("is_verified")
            or user.get("email_verified")
            or user.get("emailVerified")
        )

        joined_date = "Not set"

        if user.get("created_at"):
            joined_date = format_date(user.get("created_at"))
        elif user.get("createdAt"):
            joined_date = format_date(user.get("createdAt"))
        elif isinstance(user.get("_id"), ObjectId):
            joined_date = format_date(user.get("_id").generation_time)

        users.append(
            {
                "id": user_id,
                "name": user_display_name(user, profile),
                "email": safe_str(user.get("email")),
                "status": "Verified" if verified else "Not Verified",
                "goal": safe_str(
                    profile.get("fitness_goal")
                    or profile.get("fitnessGoal")
                    or user.get("fitness_goal")
                ),
                "joined": joined_date,
                "age": safe_str(profile.get("age")),
                "gender": safe_str(profile.get("gender")),
                "bmi": safe_str(profile.get("bmi")),
                "activityLevel": safe_str(
                    profile.get("activity_level") or profile.get("activityLevel")
                ),
                "fitnessLevel": safe_str(
                    profile.get("fitness_level") or profile.get("fitnessLevel")
                ),
                "workoutDays": safe_str(
                    profile.get("workout_days") or profile.get("workoutDays")
                ),
                "location": safe_str(profile.get("location")),
            }
        )

    return {
        "success": True,
        "users": users,
    }


@router.get("/reports")
def get_admin_reports(admin=Depends(get_current_admin)):
    db = get_database()

    reports = []

    cursor = db["progress_reports"].find({}).sort("_id", -1).limit(100)

    for report in cursor:
        user_id = report.get("user_id")
        user = {}

        if user_id:
            try:
                user = db["users"].find_one({"_id": ObjectId(str(user_id))}) or {}
            except Exception:
                user = db["users"].find_one({"_id": user_id}) or {}

        profile = get_user_profile(db, user_id) if user_id else {}

        user_name = user_display_name(user, profile) if user else "FitLife User"

        report_date = "Not set"

        if report.get("created_at"):
            report_date = format_date(report.get("created_at"))
        elif report.get("createdAt"):
            report_date = format_date(report.get("createdAt"))
        elif isinstance(report.get("_id"), ObjectId):
            report_date = format_date(report.get("_id").generation_time)

        reports.append(
            {
                "id": str(report.get("_id")),
                "user": user_name,
                "email": safe_str(user.get("email")),
                "reportType": safe_str(
                    report.get("report_type") or report.get("reportType"),
                    "Progress Report",
                ),
                "bmi": safe_str(report.get("bmi") or profile.get("bmi")),
                "healthRisk": safe_str(
                    report.get("health_risk")
                    or report.get("healthRisk")
                    or report.get("predicted_risk_level")
                ),
                "dietStatus": safe_str(
                    report.get("diet_status") or report.get("dietStatus")
                ),
                "fitness": safe_str(
                    report.get("fitness_goal")
                    or report.get("fitness")
                    or profile.get("fitness_goal")
                ),
                "sleep": safe_str(
                    report.get("sleep_status") or report.get("sleepStatus")
                ),
                "status": safe_str(report.get("status"), "Generated"),
                "date": report_date,
                "summary": safe_str(
                    report.get("summary"),
                    "This report was generated from available FitLife health and fitness records.",
                ),
            }
        )

    return {
        "success": True,
        "reports": reports,
    }


@router.get("/modules")
def get_admin_modules(admin=Depends(get_current_admin)):
    db = get_database()

    def count_collection(collection_name):
        try:
            return db[collection_name].count_documents({})
        except Exception:
            return 0

    def get_latest_date(collection_name):
        try:
            latest_record = db[collection_name].find_one(
                {},
                sort=[("_id", -1)],
            )

            if not latest_record:
                return "No records"

            latest_date = (
                latest_record.get("updated_at")
                or latest_record.get("created_at")
                or latest_record.get("createdAt")
            )

            if isinstance(latest_date, datetime):
                return latest_date.strftime("%Y-%m-%d")

            if latest_date:
                return str(latest_date)

            if isinstance(latest_record.get("_id"), ObjectId):
                return latest_record.get("_id").generation_time.strftime("%Y-%m-%d")

            return "No date"

        except Exception:
            return "No records"

    modules = [
        {
            "id": "health-risk",
            "name": "Health Risk Prediction",
            "category": "AI Prediction Module",
            "status": "Connected",
            "records": count_collection("health_risk_predictions"),
            "collection": "health_risk_predictions",
            "lastUpdated": get_latest_date("health_risk_predictions"),
            "description": "Predicts user health risk level using stored health data.",
        },
        {
            "id": "diet-recommendation",
            "name": "Diet Recommendation",
            "category": "AI Recommendation Module",
            "status": "Connected",
            "records": count_collection("diet_plans"),
            "collection": "diet_plans",
            "lastUpdated": get_latest_date("diet_plans"),
            "description": "Generates diet suggestions based on user profile and health inputs.",
        },
        {
            "id": "fitness-guider",
            "name": "AI Fitness Guider",
            "category": "Fitness Planning Module",
            "status": "Connected",
            "records": count_collection("fitness_plans"),
            "collection": "fitness_plans",
            "lastUpdated": get_latest_date("fitness_plans"),
            "description": "Creates fitness plans and workout guidance for users.",
        },
        {
            "id": "sleep-tracking",
            "name": "Sleep Tracking",
            "category": "Health Monitoring Module",
            "status": "Connected",
            "records": count_collection("sleep_records"),
            "collection": "sleep_records",
            "lastUpdated": get_latest_date("sleep_records"),
            "description": "Stores daily sleep records and supports sleep analysis.",
        },
        {
            "id": "sleep-progress",
            "name": "Sleep Progress",
            "category": "Weekly Progress Module",
            "status": "Connected",
            "records": count_collection("sleep_progress"),
            "collection": "sleep_progress",
            "lastUpdated": get_latest_date("sleep_progress"),
            "description": "Tracks weekly sleep progress and improvement status.",
        },
        {
            "id": "nutrition-log",
            "name": "Nutrition Log",
            "category": "Nutrition Tracking Module",
            "status": "Connected",
            "records": count_collection("nutrition_logs"),
            "collection": "nutrition_logs",
            "lastUpdated": get_latest_date("nutrition_logs"),
            "description": "Tracks daily nutrition records entered by users.",
        },
        {
            "id": "goals",
            "name": "Goals",
            "category": "Goal Tracking Module",
            "status": "Connected",
            "records": count_collection("goals"),
            "collection": "goals",
            "lastUpdated": get_latest_date("goals"),
            "description": "Stores user fitness and health goal progress.",
        },
        {
            "id": "progress-reports",
            "name": "Progress Reports",
            "category": "Report Generation Module",
            "status": "Connected",
            "records": count_collection("progress_reports"),
            "collection": "progress_reports",
            "lastUpdated": get_latest_date("progress_reports"),
            "description": "Generates and stores overall user progress reports.",
        },
    ]

    total_records = sum(module["records"] for module in modules)
    active_modules = len([module for module in modules if module["status"] == "Connected"])

    return {
        "success": True,
        "summary": {
            "total_modules": len(modules),
            "active_modules": active_modules,
            "total_records": total_records,
        },
        "modules": modules,
    }


@router.get("/activity")
def get_admin_recent_activity(admin=Depends(get_current_admin)):
    db = get_database()

    activities = []

    def normalize_datetime(value):
        if not value:
            return None

        if isinstance(value, datetime):
            if value.tzinfo is not None:
                return value.replace(tzinfo=None)

            return value

        return None

    def get_record_date(record):
        if not record:
            return None

        record_date = (
            record.get("updated_at")
            or record.get("created_at")
            or record.get("createdAt")
        )

        normalized_date = normalize_datetime(record_date)

        if normalized_date:
            return normalized_date

        if isinstance(record.get("_id"), ObjectId):
            return record.get("_id").generation_time.replace(tzinfo=None)

        return None

    def format_activity_date(value):
        if not value:
            return "Not set"

        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d %H:%M")

        return str(value)

    def add_latest_activity(
        collection_name,
        title,
        description,
        icon,
        activity_type,
    ):
        try:
            record = db[collection_name].find_one(
                {},
                sort=[("_id", -1)],
            )

            if not record:
                return

            activity_date = get_record_date(record)

            activities.append(
                {
                    "id": str(record.get("_id")),
                    "title": title,
                    "description": description,
                    "type": activity_type,
                    "icon": icon,
                    "collection": collection_name,
                    "date": format_activity_date(activity_date),
                    "sort_date": activity_date or datetime.min,
                }
            )

        except Exception:
            pass

    try:
        latest_user = db["users"].find_one(
            {},
            sort=[("_id", -1)],
        )

        if latest_user:
            user_id = str(latest_user.get("_id"))
            profile = get_user_profile(db, user_id)
            user_name = user_display_name(latest_user, profile)
            activity_date = get_record_date(latest_user)

            activities.append(
                {
                    "id": user_id,
                    "title": "New User Registered",
                    "description": f"{user_name} joined FitLife.",
                    "type": "User",
                    "icon": "👤",
                    "collection": "users",
                    "date": format_activity_date(activity_date),
                    "sort_date": activity_date or datetime.min,
                }
            )

    except Exception:
        pass

    add_latest_activity(
        "progress_reports",
        "Progress Report Generated",
        "A user progress report was generated and saved.",
        "📄",
        "Report",
    )

    add_latest_activity(
        "health_risk_predictions",
        "Health Risk Prediction Created",
        "A health risk prediction record was generated.",
        "🩺",
        "Health",
    )

    add_latest_activity(
        "diet_plans",
        "Diet Recommendation Generated",
        "A diet recommendation plan was created.",
        "🥗",
        "Diet",
    )

    add_latest_activity(
        "fitness_plans",
        "Fitness Plan Generated",
        "A fitness guider plan was created.",
        "🏋️",
        "Fitness",
    )

    add_latest_activity(
        "sleep_records",
        "Sleep Record Saved",
        "A sleep tracking record was saved.",
        "😴",
        "Sleep",
    )

    add_latest_activity(
        "nutrition_logs",
        "Nutrition Log Added",
        "A nutrition tracking record was added.",
        "🍎",
        "Nutrition",
    )

    add_latest_activity(
        "goals",
        "Goal Progress Saved",
        "A user goal tracking record was saved.",
        "🎯",
        "Goal",
    )

    activities = sorted(
        activities,
        key=lambda item: item["sort_date"],
        reverse=True,
    )

    cleaned_activities = []

    for activity in activities[:8]:
        activity.pop("sort_date", None)
        cleaned_activities.append(activity)

    return {
        "success": True,
        "activities": cleaned_activities,
    }