from .database import SessionLocal
from .models import SearchLog, Document, IngestionJob
from datetime import datetime

class SearchLogRepository:
    def log(self, query: str, count: int):
        db = SessionLocal()
        try:
            db.add(SearchLog(query=query, result_count=count))
            db.commit()
        finally:
            db.close()

class DocumentRepository:
    def save_many(self, docs: list):
        db = SessionLocal()
        try:
            objs = []
            for d in docs:
                objs.append(Document(
                    title=d.get("title"),
                    authors=d.get("authors", []),
                    year=d.get("year"),
                    publisher=d.get("publisher"),
                    doi=d.get("doi"),
                    isbn=d.get("isbn", []),
                    subjects=d.get("subjects", []),
                    abstract=d.get("abstract"),
                    description=d.get("description"),
                    source=d.get("source"),
                    source_url=d.get("source_url"),
                    source_id=d.get("source_id"),
                    metadata_json=d.get("metadata", {})
                ))
            db.add_all(objs)
            db.commit()
            return len(objs)
        finally:
            db.close()
