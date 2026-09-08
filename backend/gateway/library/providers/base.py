from abc import ABC, abstractmethod
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from typing import Optional

class NormalizedDoc(BaseModel):
    id: Optional[str] = None
    title: str
    authors: List[str] = []
    year: Optional[int] = None
    abstract: Optional[str] = None
    description: Optional[str] = None
    publisher: Optional[str] = None
    language: Optional[str] = None
    isbn: List[str] = []
    doi: Optional[str] = None
    subjects: List[str] = []
    source: str
    source_url: Optional[str] = None
    source_id: Optional[str] = None
    license: Optional[str] = None
    full_text_url: Optional[str] = None
    thumbnail: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    score: float = 0.0

class LibraryProvider(ABC):
    name: str = "base"
    
    @abstractmethod
    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        pass

    def normalize(self, raw: Dict[str, Any]) -> NormalizedDoc:
        # fallback, override in each provider for best mapping
        return NormalizedDoc(
            title=raw.get("title","Untitled"),
            source=self.name,
            source_url=raw.get("source_url"),
            metadata=raw
        )
