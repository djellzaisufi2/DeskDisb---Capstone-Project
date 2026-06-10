from fastapi import FastAPI
from app.database import Base, engine
from app.models.users import User
from app.models.resources import Resource
from app.models.reservations import Reservation

Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Database connected!"}