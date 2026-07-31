from __future__ import annotations

import hashlib
import math
import re
import unicodedata
from collections.abc import Sequence
from functools import lru_cache
from typing import Protocol

from app.core.config import get_settings


class EmbeddingBackend(Protocol):
    """Keeps the matching engine independent from one embedding vendor."""

    name: str

    def embed(self, texts: Sequence[str]) -> list[list[float]]: ...


SEMANTIC_ALIASES: dict[str, tuple[str, ...]] = {
    "frontend": (
        "frontend",
        "front end",
        "front-end",
        "giao diện web",
        "web ui",
    ),
    "react": (
        "react",
        "reactjs",
        "react.js",
        "front-end framework",
        "frontend framework",
    ),
    "leadership": (
        "leadership",
        "team lead",
        "team leadership",
        "lead team",
        "quản lý nhóm",
        "dẫn dắt đội ngũ",
        "lãnh đạo nhóm",
    ),
    "machine_learning": (
        "machine learning",
        "ml",
        "học máy",
        "predictive modeling",
    ),
    "deep_learning": ("deep learning", "dl", "học sâu", "neural network"),
    "data_engineering": (
        "data engineering",
        "data engineer",
        "etl",
        "xây dựng pipeline dữ liệu",
    ),
    "backend": (
        "backend",
        "back end",
        "back-end",
        "server side",
        "phía máy chủ",
    ),
    "cloud": ("cloud", "aws", "azure", "gcp", "điện toán đám mây"),
    "devops": ("devops", "ci/cd", "continuous integration", "docker", "kubernetes"),
    "product": ("product", "sản phẩm", "product development", "phát triển sản phẩm"),
    "fintech": ("fintech", "financial technology", "công nghệ tài chính"),
    "automotive": ("automotive", "ô tô", "xe điện", "electric vehicle"),
}


def _normalize(text: str) -> str:
    value = unicodedata.normalize("NFKC", text or "").casefold()
    value = re.sub(r"[^\w+#./-]+", " ", value, flags=re.UNICODE)
    return re.sub(r"\s+", " ", value).strip()


def _replace_aliases(text: str) -> str:
    value = f" {_normalize(text)} "
    alias_pairs = sorted(
        (
            (_normalize(alias), concept)
            for concept, aliases in SEMANTIC_ALIASES.items()
            for alias in aliases
        ),
        key=lambda item: len(item[0]),
        reverse=True,
    )
    for normalized_alias, concept in alias_pairs:
        value = re.sub(
            rf"(?<![\w]){re.escape(normalized_alias)}(?![\w])",
            f" concept_{concept} ",
            value,
        )
    return re.sub(r"\s+", " ", value).strip()


class DomainHashEmbeddingBackend:
    """Deterministic offline fallback with a VinCareer semantic concept layer."""

    name = "domain-hash-v1"

    def __init__(self, dimensions: int = 384):
        self.dimensions = dimensions

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        return [self._embed_one(text) for text in texts]

    def _embed_one(self, text: str) -> list[float]:
        normalized = _replace_aliases(text)
        vector = [0.0] * self.dimensions
        tokens = normalized.split()
        features = [
            *tokens,
            *(f"{left}_{right}" for left, right in zip(tokens, tokens[1:])),
        ]
        for feature in features:
            digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
            index = int.from_bytes(digest[:4], "big") % self.dimensions
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            weight = 3.0 if feature.startswith("concept_") else 1.0
            vector[index] += sign * weight
        norm = math.sqrt(sum(value * value for value in vector))
        return [value / norm for value in vector] if norm else vector


class SentenceTransformerEmbeddingBackend:
    """Multilingual contextual embeddings used by the production matcher."""

    name = "sentence-transformer"

    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer

        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def embed(self, texts: Sequence[str]) -> list[list[float]]:
        prepared = [_replace_aliases(text) for text in texts]
        vectors = self.model.encode(
            prepared,
            batch_size=32,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return [vector.astype(float).tolist() for vector in vectors]


@lru_cache
def get_embedding_backend() -> EmbeddingBackend:
    settings = get_settings()
    if settings.embedding_backend == "domain_hash":
        return DomainHashEmbeddingBackend()
    try:
        return SentenceTransformerEmbeddingBackend(settings.embedding_model)
    except (ImportError, OSError, RuntimeError):
        # Offline tests and demos remain usable with the domain-aware vector
        # fallback. Production should install requirements and cache the model.
        return DomainHashEmbeddingBackend()


def cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    similarity = sum(a * b for a, b in zip(left, right)) / (left_norm * right_norm)
    return max(0.0, min(1.0, similarity))
