from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, Float
from sqlalchemy.sql import func
from .database import Base
import uuid

def gen_id():
    return str(uuid.uuid4())

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=gen_id)
    title = Column(String, index=True)
    authors = Column(JSON, default=list)
    year = Column(Integer, nullable=True)
    publisher = Column(String, nullable=True)
    language = Column(String, nullable=True)
    isbn = Column(JSON, default=list)
    doi = Column(String, nullable=True, index=True)
    subjects = Column(JSON, default=list)
    abstract = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    source = Column(String, index=True)
    source_url = Column(String, nullable=True)
    source_id = Column(String, nullable=True)
    license = Column(String, nullable=True)
    full_text_available = Column(Boolean, default=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SearchLog(Base):
    __tablename__ = "search_logs"
    id = Column(String, primary_key=True, default=gen_id)
    query = Column(String, index=True)
    result_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"
    id = Column(String, primary_key=True, default=gen_id)
    query = Column(String)
    status = Column(String, default="queued") # queued, running, done, failed
    docs_ingested = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)
