from fastapi import APIRouter
router = APIRouter(tags=["Health"])

@router.get("/health")
def health():
    return {"status": "ok", "service": "VihokAI Global Library Gateway"}

@router.get("/health/ready")
async def ready():
    checks = {}
    # DB check
    try:
        from gateway.database.database import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        checks["postgres"] = "ok"
    except Exception as e:
        checks["postgres"] = f"fail: {e}"
    # Qdrant
    try:
        from gateway.vector_db.client import get_qdrant_client
        client = get_qdrant_client()
        client.get_collections()
        checks["qdrant"] = "ok"
    except Exception as e:
        checks["qdrant"] = f"fail: {e}"
    # Redis
    try:
        import redis, os
        r = redis.from_url(os.getenv("REDIS_URL","redis://redis:6379/0"))
        r.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"fail: {e}"
    return checks
