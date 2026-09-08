import os
from functools import lru_cache

_model = None

@lru_cache(maxsize=1)
def get_embedding_model():
    global _model
    if _model is not None:
        return _model
    try:
        from sentence_transformers import SentenceTransformer
        name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        _model = SentenceTransformer(name)
        return _model
    except Exception as e:
        # fallback dummy that returns zero vector - for CI without model
        print(f"Embedding model load failed, using dummy: {e}")
        class Dummy:
            def encode(self, texts, **kwargs):
                import numpy as np
                if isinstance(texts, str):
                    return np.zeros(384)
                return np.zeros((len(texts), 384))
        _model = Dummy()
        return _model
