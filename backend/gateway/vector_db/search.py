from typing import List, Dict, Any
from .client import get_qdrant_client
from .collections import COLLECTION
from gateway.embeddings.model import get_embedding_model

def semantic_search(query: str, top_k: int = 5, filter_source: str = None) -> List[Dict[str, Any]]:
    client = get_qdrant_client()
    model = get_embedding_model()
    vec = model.encode(query).tolist()
    results = client.search(
        collection_name=COLLECTION,
        query_vector=vec,
        limit=top_k
    )
    out = []
    for r in results:
        payload = r.payload or {}
        payload["qdrant_score"] = r.score
        payload["qdrant_id"] = str(r.id)
        out.append(payload)
    return out

def upsert_docs(docs: List[Dict[str, Any]], vectors: List[List[float]]):
    from qdrant_client.models import PointStruct
    import uuid
    client = get_qdrant_client()
    points = []
    for doc, vec in zip(docs, vectors):
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vec,
            payload=doc
        ))
    client.upsert(collection_name=COLLECTION, points=points)
    return len(points)
