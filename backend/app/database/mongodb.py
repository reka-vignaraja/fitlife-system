from pymongo import MongoClient
from app.core.config import settings

client = None
database = None


def connect_to_mongo():
    global client, database

    client = MongoClient(settings.MONGO_URI)
    database = client[settings.DATABASE_NAME]

    client.admin.command("ping")
    print("MongoDB connected successfully")


def close_mongo_connection():
    global client

    if client:
        client.close()
        print("MongoDB connection closed")


def get_database():
    if database is None:
        raise RuntimeError("Database is not connected")
    return database