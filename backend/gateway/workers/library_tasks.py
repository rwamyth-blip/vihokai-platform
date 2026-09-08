from .celery import celery_app
import asyncio
from gateway.library.router import LibraryRouter
from gateway.library.normalizer import normalize_results
from gateway.embeddings.model import get_embedding_model
from gateway.vector_db.search import upsert_docs
from gateway.database.models import IngestionJob
from gateway.database.database import SessionLocal
from datetime import datetime, timezone

@celery_app.task(name="ingest_library")
def ingest_task(query: str, limit: int = 10):
    db = SessionLocal()
    job = IngestionJob(query=query, status="running")
    db.add(job)
    db.commit()
    job_id = job.id
    try:
        async def _run():
            router = LibraryRouter()
            raw = await router.search(query, limit=limit)
            norm = normalize_results(raw)
            return norm
        
        docs = asyncio.run(_run())
        # embeddings
        model = get_embedding_model()
        texts = [f"{d.get('title','')} {' '.join(d.get('authors',[]))} {d.get('description','') or d.get('abstract','') or ''}" for d in docs]
        vectors = model.encode(texts).tolist() if texts else []
        
        if vectors:
            upsert_docs(docs, vectors)
        
        db.query(IngestionJob).filter(IngestionJob.id==job_id).update({"status":"done","docs_ingested": len(docs), "finished_at": datetime.now(timezone.utc)})
        db.commit()
        return {"ingested": len(docs), "job_id": job_id}
    except Exception as e:
        db.query(IngestionJob).filter(IngestionJob.id==job_id).update({"status":"failed","finished_at": datetime.now(timezone.utc)})
        db.commit()
        raise e
    finally:
        db.close()
