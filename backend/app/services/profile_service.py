from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from app.database.mongodb import get_database


def create_profile(data):
    db = get_database()
    collection = db["profiles"]

    profile = {
        "name": data.name,
        "email": data.email,
        "age": data.age,
        "gender": data.gender,
        "height": data.height,
        "weight": data.weight,
        "activity_level": data.activity_level,
        "goal": data.goal,
        "diet_type": data.diet_type,
        "medical_conditions": data.medical_conditions,
        "allergies": data.allergies,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = collection.insert_one(profile)

    profile["_id"] = str(result.inserted_id)
    profile["created_at"] = profile["created_at"].isoformat()
    profile["updated_at"] = profile["updated_at"].isoformat()

    return {
        "message": "Profile created successfully",
        "profile": profile
    }


def get_profiles():
    db = get_database()
    collection = db["profiles"]

    profiles = []

    for profile in collection.find():
        profile["_id"] = str(profile["_id"])
        profile["created_at"] = profile["created_at"].isoformat()
        profile["updated_at"] = profile["updated_at"].isoformat()
        profiles.append(profile)

    return profiles


def update_profile(profile_id, data):
    db = get_database()
    collection = db["profiles"]

    if not ObjectId.is_valid(profile_id):
        raise HTTPException(status_code=400, detail="Invalid Profile ID")

    update_data = data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    result = collection.update_one(
        {"_id": ObjectId(profile_id)},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {"message": "Profile updated successfully"}


def delete_profile(profile_id):
    db = get_database()
    collection = db["profiles"]

    if not ObjectId.is_valid(profile_id):
        raise HTTPException(status_code=400, detail="Invalid Profile ID")

    result = collection.delete_one({"_id": ObjectId(profile_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {"message": "Profile deleted successfully"}