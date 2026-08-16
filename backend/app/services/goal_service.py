from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.database.mongodb import get_database


def calculate_progress(current_value: float, target_value: float):
    if target_value <= 0:
        return 0

    progress = (current_value / target_value) * 100
    return round(min(progress, 100), 2)


def get_goal_status(progress: float):
    if progress >= 100:
        return "Completed"
    elif progress >= 70:
        return "Almost Completed"
    elif progress >= 30:
        return "In Progress"
    else:
        return "Started"


def generate_goal_recommendations(category: str, progress: float, priority: str):
    recommendations = []

    category = category.lower()
    priority = priority.lower()

    if progress < 30:
        recommendations.append("Start with small daily actions to build consistency.")
    elif progress < 70:
        recommendations.append("Your progress is improving. Continue your current routine.")
    elif progress < 100:
        recommendations.append("You are close to your goal. Stay consistent until completion.")
    else:
        recommendations.append("Goal completed successfully. Set a new advanced target.")

    if category == "weight loss":
        recommendations.append("Maintain calorie control and include regular cardio workouts.")
    elif category == "weight gain":
        recommendations.append("Increase healthy calorie intake and include strength training.")
    elif category == "muscle gain":
        recommendations.append("Focus on protein intake and progressive strength training.")
    elif category == "fitness":
        recommendations.append("Follow a weekly workout routine and track workout progress.")
    elif category == "nutrition":
        recommendations.append("Maintain balanced meals, hydration, and macro targets.")
    elif category == "sleep":
        recommendations.append("Keep a consistent bedtime and aim for 7 to 9 hours of sleep.")
    else:
        recommendations.append("Track progress weekly and adjust your plan when needed.")

    if priority == "high":
        recommendations.append("This is a high priority goal. Review your progress frequently.")

    return recommendations


def convert_goal(goal):
    goal["_id"] = str(goal["_id"])

    if "created_at" in goal:
        goal["created_at"] = goal["created_at"].isoformat()

    if "updated_at" in goal:
        goal["updated_at"] = goal["updated_at"].isoformat()

    return goal


def create_goal(data):
    db = get_database()
    goals_collection = db["goals"]

    progress = calculate_progress(data.current_value, data.target_value)
    status_text = get_goal_status(progress)

    goal = {
        "title": data.title,
        "category": data.category,
        "target_value": data.target_value,
        "current_value": data.current_value,
        "unit": data.unit,
        "deadline": data.deadline,
        "priority": data.priority,
        "notes": data.notes,
        "progress": progress,
        "status": status_text,
        "recommendations": generate_goal_recommendations(
            data.category,
            progress,
            data.priority,
        ),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    insert_result = goals_collection.insert_one(goal)

    goal["_id"] = str(insert_result.inserted_id)
    goal["created_at"] = goal["created_at"].isoformat()
    goal["updated_at"] = goal["updated_at"].isoformat()

    return {
        "message": "Goal created successfully",
        "goal": goal,
    }


def get_all_goals():
    db = get_database()
    goals_collection = db["goals"]

    goals = list(
        goals_collection.find().sort("created_at", -1)
    )

    converted_goals = [convert_goal(goal) for goal in goals]

    return {
        "total": len(converted_goals),
        "goals": converted_goals,
    }


def update_goal_progress(goal_id: str, data):
    db = get_database()
    goals_collection = db["goals"]

    if not ObjectId.is_valid(goal_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid goal ID",
        )

    goal = goals_collection.find_one({"_id": ObjectId(goal_id)})

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    progress = calculate_progress(data.current_value, goal["target_value"])
    status_text = get_goal_status(progress)

    recommendations = generate_goal_recommendations(
        goal["category"],
        progress,
        goal["priority"],
    )

    goals_collection.update_one(
        {"_id": ObjectId(goal_id)},
        {
            "$set": {
                "current_value": data.current_value,
                "progress": progress,
                "status": status_text,
                "recommendations": recommendations,
                "updated_at": datetime.utcnow(),
            }
        },
    )

    updated_goal = goals_collection.find_one({"_id": ObjectId(goal_id)})

    return {
        "message": "Goal progress updated successfully",
        "goal": convert_goal(updated_goal),
    }


def delete_goal(goal_id: str):
    db = get_database()
    goals_collection = db["goals"]

    if not ObjectId.is_valid(goal_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid goal ID",
        )

    result = goals_collection.delete_one({"_id": ObjectId(goal_id)})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found",
        )

    return {
        "message": "Goal deleted successfully",
    }