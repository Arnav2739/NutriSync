import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Matches docker-compose.yml port 5433 by default, or allows custom DATABASE_URL override
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgrespassword@localhost:5433/nutrisync_db"
)

# Normalize URL: Ensure proper dialect driver for cloud providers (Neon, Render, Supabase)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql://") and not SQLALCHEMY_DATABASE_URL.startswith("postgresql+"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

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