"""
RAG Studio Pro - Retrieval Module
Real search with cosine similarity and reranking.
"""

import time
from typing import List, Dict, Any, Optional
import numpy as np


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a_np = np.array(a, dtype=np.float64)
    b_np = np.array(b, dtype=np.float64)
    norm_a = np.linalg.norm(a_np)
    norm_b = np.linalg.norm(b_np)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a_np, b_np) / (norm_a * norm_b))


def rerank_results(
    query: str,
    results: List[Dict],
    method: str = "cross_encoder",
) -> List[Dict]:
    """
    Rerank retrieval results for better precision.
    Methods: cross_encoder, keyword_overlap, mmr
    """
    if not results:
        return results

    if method == "cross_encoder":
        return _rerank_cross_encoder(query, results)
    elif method == "keyword_overlap":
        return _rerank_keyword(query, results)
    elif method == "mmr":
        return _rerank_mmr(query, results)
    else:
        return results


def _rerank_cross_encoder(query: str, results: List[Dict]) -> List[Dict]:
    """Rerank using a cross-encoder model."""
    try:
        from sentence_transformers import CrossEncoder
        model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

        pairs = [(query, r.get("text", "")) for r in results]
        scores = model.predict(pairs)

        for i, score in enumerate(scores):
            results[i]["original_score"] = results[i].get("score", 0)
            results[i]["score"] = float(score)
            results[i]["reranked"] = True

        results.sort(key=lambda x: x["score"], reverse=True)

        for i, r in enumerate(results):
            r["rank"] = i + 1

        return results
    except Exception:
        return _rerank_keyword(query, results)


def _rerank_keyword(query: str, results: List[Dict]) -> List[Dict]:
    """Simple keyword overlap reranking."""
    query_words = set(query.lower().split())

    for r in results:
        text_words = set(r.get("text", "").lower().split())
        overlap = len(query_words & text_words)
        original_score = r.get("score", 0)
        # Combine original score with keyword overlap
        r["original_score"] = original_score
        r["score"] = original_score + (overlap * 0.1)
        r["reranked"] = True

    results.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return results


def _rerank_mmr(query: str, results: List[Dict], lambda_param: float = 0.7) -> List[Dict]:
    """Maximal Marginal Relevance reranking for diversity."""
    if len(results) <= 1:
        return results

    query_words = set(query.lower().split())
    selected = [results[0]]
    remaining = results[1:]

    while remaining and len(selected) < len(results):
        best_score = -float("inf")
        best_idx = 0

        for i, candidate in enumerate(remaining):
            # Relevance to query
            cand_words = set(candidate.get("text", "").lower().split())
            relevance = len(query_words & cand_words) / max(len(query_words), 1)

            # Max similarity to already selected
            max_sim = 0
            for sel in selected:
                sel_words = set(sel.get("text", "").lower().split())
                if cand_words and sel_words:
                    sim = len(cand_words & sel_words) / max(len(cand_words | sel_words), 1)
                    max_sim = max(max_sim, sim)

            # MMR score
            mmr_score = lambda_param * relevance - (1 - lambda_param) * max_sim

            if mmr_score > best_score:
                best_score = mmr_score
                best_idx = i

        selected.append(remaining.pop(best_idx))

    for i, r in enumerate(selected):
        r["rank"] = i + 1
        r["reranked"] = True
        r["mmr_score"] = r.get("score", 0)

    return selected


def hybrid_search(
    query: str,
    semantic_results: List[Dict],
    keyword_results: List[Dict] = None,
    semantic_weight: float = 0.7,
    top_k: int = 5,
) -> List[Dict]:
    """
    Combine semantic and keyword search results.
    """
    if not keyword_results:
        return semantic_results[:top_k]

    # Score normalization
    all_results = {}

    for r in semantic_results:
        rid = r.get("id", "")
        all_results[rid] = {
            **r,
            "semantic_score": r.get("score", 0),
            "keyword_score": 0,
        }

    for r in keyword_results:
        rid = r.get("id", "")
        if rid in all_results:
            all_results[rid]["keyword_score"] = r.get("score", 0)
        else:
            all_results[rid] = {
                **r,
                "semantic_score": 0,
                "keyword_score": r.get("score", 0),
            }

    # Combine scores
    for rid, r in all_results.items():
        r["score"] = (
            semantic_weight * r["semantic_score"] +
            (1 - semantic_weight) * r["keyword_score"]
        )

    combined = sorted(all_results.values(), key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(combined):
        r["rank"] = i + 1

    return combined[:top_k]


def keyword_search(query: str, chunks: List[Dict], top_k: int = 5) -> List[Dict]:
    """Simple keyword-based search using TF-IDF-like scoring."""
    import math

    query_words = query.lower().split()
    if not query_words:
        return []

    # Build IDF-like weights
    doc_freq = {}
    for chunk in chunks:
        words = set(chunk.get("text", "").lower().split())
        for w in words:
            doc_freq[w] = doc_freq.get(w, 0) + 1

    total_docs = len(chunks)
    idf = {}
    for w, freq in doc_freq.items():
        idf[w] = math.log(total_docs / (1 + freq))

    # Score each chunk
    results = []
    for chunk in chunks:
        text_words = chunk.get("text", "").lower().split()
        if not text_words:
            continue

        score = 0
        for qw in query_words:
            if qw in idf:
                tf = text_words.count(qw) / len(text_words)
                score += tf * idf.get(qw, 0)

        if score > 0:
            results.append({
                **chunk,
                "score": score,
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(results[:top_k]):
        r["rank"] = i + 1

    return results[:top_k]
