from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models.user import User, UserRole

Base.metadata.create_all(bind=engine)

db = SessionLocal()

DEMO_USERS = [
    ("sarah.chen@genpact.com", "password123", "Sarah Chen", UserRole.admin, "Office Manager"),
    ("priya.sharma@genpact.com", "password123", "Priya Sharma", UserRole.manager, "Director of Workplace"),
    ("jane.smith@genpact.com", "password123", "Jane Smith", UserRole.employee, "Software Engineer"),
]


for email, password, full_name, role, job_title in DEMO_USERS:
    user = db.query(User).filter(User.email == email).first()

    if user:
        user.hashed_password = hash_password(password)
        user.full_name = full_name
        user.role = role
        user.job_title = job_title
    else:
        db.add(
            User(
                email=email,
                hashed_password=hash_password(password),
                full_name=full_name,
                role=role,
                job_title=job_title,
            )
        )

db.commit()
db.close()

print("Seed complete (AUTH USERS ONLY)")