from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

_is_neon = "neon.tech" in settings.DATABASE_URL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # handles stale connections automatically — no manual ping needed
    pool_size=10,
    max_overflow=20,
    pool_timeout=60,
    pool_recycle=300,     # recycle before Neon's 5-min idle timeout
    connect_args={
        "connect_timeout": 30,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    } if _is_neon else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
