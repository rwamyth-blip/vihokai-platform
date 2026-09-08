from qdrant_client.models import Distance, VectorParams
import os

COLLECTION = os.getenv("QDRANT_COLLECTION", "vihokai_docs")
DIM = int(os.getenv("EMBEDDING_DIM", "384"))

def ensure_collections(client):
    collections = [c.name for c in client.get_collections().collections]
    if COLLECTION not in collections:
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=DIM, distance=Distance.COSINE)
        )
