from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings
from app.database.mongodb import get_database
from app.schemas.goal_schema import GoalCreateRequest, GoalProgressUpdateRequest


router = APIRouter(
    prefix="/api/goals",
    tags=["Goal Management"],
)

security = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials

        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def convert_request_to_dict(data):
    try:
        return data.model_dump()
    except Exception:
        return data.dict()


def calculate_goal_progress(category, start_value, current_value, target_value):
    try:
        start = float(start_value)
        current = float(current_value)
        target = float(target_value)

        if start == target:
            return 100

        category_text = str(category or "").lower()

        # Weight loss or decreasing target goal
        if "weight loss" in category_text or target < start:
            total_change_needed = start - target
            completed_change = start - current

            if total_change_needed <= 0:
                return 0

            progress = (completed_change / total_change_needed) * 100

        # Weight gain, muscle gain, workouts, sleep hours, nutrition score etc.
        else:
            total_change_needed = target - start
            completed_change = current - start

            if total_change_needed <= 0:
                return 0

            progress = (completed_change / total_change_needed) * 100

        if progress < 0:
            return 0

        if progress > 100:
            return 100

        return round(progress, 1)

    except Exception:
        return 0


def get_goal_status(progress):
    try:
        progress = float(progress)
    except Exception:
        progress = 0

    if progress >= 100:
        return "Completed"

    if progress >= 60:
        return "On Track"

    if progress >= 30:
        return "In Progress"

    return "Started"


def build_goal_recommendations(category, progress):
    category = str(category or "").lower()

    recommendations = []

    if progress >= 100:
        recommendations.append("Great work. You have completed this goal.")
    elif progress >= 60:
        recommendations.append("You are making good progress. Continue your current routine.")
    elif progress >= 30:
        recommendations.append("Your goal is in progress. Stay consistent and update progress weekly.")
    else:
        recommendations.append("Start with small consistent actions to build momentum.")

    if category == "weight loss":
        recommendations.append("Maintain calorie control and regular physical activity.")
    elif category == "weight gain":
        recommendations.append("Increase healthy calorie intake and follow strength training.")
    elif category == "muscle gain":
        recommendations.append("Focus on progressive strength training and protein intake.")
    elif category == "sleep":
        recommendations.append("Maintain a consistent sleep schedule and reduce screen time before bed.")
    elif category == "nutrition":
        recommendations.append("Follow a balanced meal plan and track daily food habits.")
    else:
        recommendations.append("Review your progress regularly using the Progress Report module.")

    return recommendations


def serialize_goal(goal):
    return {
        "_id": str(goal["_id"]),
        "title": goal.get("title", ""),
        "category": goal.get("category", ""),
        "start_value": goal.get("start_value", goal.get("current_value", 0)),
        "target_value": goal.get("target_value", 0),
        "current_value": goal.get("current_value", 0),
        "unit": goal.get("unit", ""),
        "deadline": goal.get("deadline", ""),
        "priority": goal.get("priority", "medium"),
        "notes": goal.get("notes", ""),
        "progress": goal.get("progress", 0),
        "progress_percentage": goal.get("progress_percentage", 0),
        "status": goal.get("status", "Started"),
        "recommendations": goal.get("recommendations", []),
        "created_at": goal.get("created_at"),
        "updated_at": goal.get("updated_at"),
    }


@router.post("/create")
def create_new_goal(
    data: GoalCreateRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        db = get_database()
        goals_collection = db["goals"]

        goal_data = convert_request_to_dict(data)

        target_value = goal_data.get("target_value")
        current_value = goal_data.get("current_value")
        category = goal_data.get("category", "fitness")

        # At creation time, current value becomes the starting value.
        start_value = current_value

        progress = calculate_goal_progress(
            category,
            start_value,
            current_value,
            target_value,
        )

        status = get_goal_status(progress)

        goal_record = {
            **goal_data,
            "user_id": user_id,
            "user_object_id": ObjectId(user_id),
            "start_value": start_value,
            "progress": progress,
            "progress_percentage": progress,
            "status": status,
            "recommendations": build_goal_recommendations(category, progress),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = goals_collection.insert_one(goal_record)

        created_goal = goals_collection.find_one({"_id": result.inserted_id})

        return {
            "message": "Goal created successfully",
            "goal": serialize_goal(created_goal),
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print("GOAL CREATE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def list_goals(user_id: str = Depends(get_current_user_id)):
    try:
        db = get_database()
        goals_collection = db["goals"]

        possible_ids = [user_id]

        try:
            possible_ids.append(ObjectId(user_id))
        except Exception:
            pass

        goals = list(
            goals_collection.find(
                {
                    "$or": [
                        {"user_id": {"$in": possible_ids}},
                        {"user_object_id": {"$in": possible_ids}},
                    ]
                }
            ).sort("created_at", -1)
        )

        return {
            "message": "Goals fetched successfully",
            "goals": [serialize_goal(goal) for goal in goals],
        }

    except Exception as e:
        print("GOAL LIST ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{goal_id}/progress")
def update_progress(
    goal_id: str,
    data: GoalProgressUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    try:
        db = get_database()
        goals_collection = db["goals"]

        try:
            goal_object_id = ObjectId(goal_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid goal id")

        possible_ids = [user_id]

        try:
            possible_ids.append(ObjectId(user_id))
        except Exception:
            pass

        goal = goals_collection.find_one(
            {
                "_id": goal_object_id,
                "$or": [
                    {"user_id": {"$in": possible_ids}},
                    {"user_object_id": {"$in": possible_ids}},
                ],
            }
        )

        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        progress_data = convert_request_to_dict(data)

        new_current_value = progress_data.get("current_value")

        start_value = goal.get("start_value", goal.get("current_value"))
        target_value = goal.get("target_value")
        category = goal.get("category", "fitness")

        progress = calculate_goal_progress(
            category,
            start_value,
            new_current_value,
            target_value,
        )

        status = get_goal_status(progress)

        recommendations = build_goal_recommendations(
            category,
            progress,
        )

        goals_collection.update_one(
            {"_id": goal_object_id},
            {
                "$set": {
                    "current_value": new_current_value,
                    "progress": progress,
                    "progress_percentage": progress,
                    "status": status,
                    "recommendations": recommendations,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        updated_goal = goals_collection.find_one({"_id": goal_object_id})

        return {
            "message": "Goal progress updated successfully",
            "goal": serialize_goal(updated_goal),
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print("GOAL UPDATE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{goal_id}")
def remove_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
):
    try:
        db = get_database()
        goals_collection = db["goals"]

        try:
            goal_object_id = ObjectId(goal_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid goal id")

        possible_ids = [user_id]

        try:
            possible_ids.append(ObjectId(user_id))
        except Exception:
            pass

        result = goals_collection.delete_one(
            {
                "_id": goal_object_id,
                "$or": [
                    {"user_id": {"$in": possible_ids}},
                    {"user_object_id": {"$in": possible_ids}},
                ],
            }
        )

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Goal not found")

        return {
            "message": "Goal deleted successfully",
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print("GOAL DELETE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))