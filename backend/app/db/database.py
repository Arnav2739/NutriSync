import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Matches docker-compose.yml port 5433 by default, or allows custom DATABASE_URL override
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgrespassword@localhost:5433/nutrisync_db"
)

# Cloud providers (Neon, Render, Supabase) often supply postgres://; SQLAlchemy requires postgresql://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# pool_pre_ping=True prevents stale connection drops on serverless/cloud databases
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency to get a database session for API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()