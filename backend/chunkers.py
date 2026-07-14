"""
RAG Studio Pro - Chunking Strategies
7 real chunking strategies with live parameter changes.
"""

import re
import hashlib
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ChunkData:
    id: str
    text: str
    index: int
    start_char: int
    end_char: int
    metadata: Dict[str, Any]
    parent_id: Optional[str] = None


def _chunk_id(text: str, index: int) -> str:
    """Generate deterministic chunk ID."""
    content = f"{index}:{text[:100]}"
    return hashlib.md5(content.encode()).hexdigest()[:12]


# ─── 1. Recursive Character Splitting ─────────────────────────────

def chunk_recursive(text: str, chunk_size: int = 500, overlap: int = 50) -> List[ChunkData]:
    """LangChain-style recursive character splitting."""
    separators = ["\n\n", "\n", ". ", " ", ""]
    chunks = []

    def _split_recursive(text: str, separators: list) -> List[str]:
        if len(text) <= chunk_size:
            return [text]

        sep = separators[0] if separators else ""
        remaining_seps = separators[1:] if len(separators) > 1 else []

        if sep:
            parts = text.split(sep)
        else:
            parts = list(text)

        current = ""
        result = []

        for part in parts:
            test = current + sep + part if current else part
            if len(test) > chunk_size and current:
                result.append(current)
                # Keep overlap
                if overlap > 0:
                    overlap_text = current[-overlap:] if len(current) > overlap else current
                    current = overlap_text + sep + part
                else:
                    current = part
            else:
                current = test

        if current:
            result.append(current)

        # Recursively split any chunks that are still too large
        final = []
        for chunk in result:
            if len(chunk) > chunk_size and remaining_seps:
                final.extend(_split_recursive(chunk, remaining_seps))
            else:
                final.append(chunk)

        return final

    raw_chunks = _split_recursive(text, separators)

    pos = 0
    for i, chunk_text in enumerate(raw_chunks):
        start = text.find(chunk_text, pos)
        if start == -1:
            start = pos
        end = start + len(chunk_text)

        chunks.append(ChunkData(
            id=_chunk_id(chunk_text, i),
            text=chunk_text.strip(),
            index=i,
            start_char=start,
            end_char=end,
            metadata={"method": "recursive", "separator_used": "auto"},
        ))
        pos = max(pos, start + 1)

    return chunks


# ─── 2. Sentence Splitting ────────────────────────────────────────

def chunk_sentence(text: str, chunk_size: int = 500, overlap: int = 50) -> List[ChunkData]:
    """Split by sentences, then group into chunks of target size."""
    # Split on sentence boundaries
    sentence_pattern = r'(?<=[.!?])\s+'
    sentences = re.split(sentence_pattern, text)

    chunks = []
    current_sentences = []
    current_length = 0
    chunk_index = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        if current_length + len(sentence) > chunk_size and current_sentences:
            chunk_text = " ".join(current_sentences)
            start = text.find(current_sentences[0])
            end = text.find(sentence, start) if start != -1 else start + len(chunk_text)

            chunks.append(ChunkData(
                id=_chunk_id(chunk_text, chunk_index),
                text=chunk_text,
                index=chunk_index,
                start_char=max(0, start),
                end_char=end,
                metadata={"method": "sentence", "sentence_count": len(current_sentences)},
            ))
            chunk_index += 1

            # Overlap: keep last N characters worth of sentences
            if overlap > 0:
                overlap_chars = 0
                overlap_start = len(current_sentences)
                for j in range(len(current_sentences) - 1, -1, -1):
                    overlap_chars += len(current_sentences[j])
                    if overlap_chars > overlap:
                        overlap_start = j
                        break
                current_sentences = current_sentences[overlap_start:]
                current_length = sum(len(s) for s in current_sentences)
            else:
                current_sentences = []
                current_length = 0

        current_sentences.append(sentence)
        current_length += len(sentence)

    # Final chunk
    if current_sentences:
        chunk_text = " ".join(current_sentences)
        start = text.find(current_sentences[0])
        chunks.append(ChunkData(
            id=_chunk_id(chunk_text, chunk_index),
            text=chunk_text,
            index=chunk_index,
            start_char=max(0, start),
            end_char=start + len(chunk_text) if start != -1 else len(chunk_text),
            metadata={"method": "sentence", "sentence_count": len(current_sentences)},
        ))

    return chunks


# ─── 3. Markdown Splitting ────────────────────────────────────────

def chunk_markdown(text: str, chunk_size: int = 500, overlap: int = 50) -> List[ChunkData]:
    """Split by markdown headers, respecting document structure."""
    # Split on markdown headers
    header_pattern = r'\n(?=#{1,6}\s)'
    sections = re.split(header_pattern, text)

    chunks = []
    current = ""
    chunk_index = 0

    for section in sections:
        section = section.strip()
        if not section:
            continue

        if len(current) + len(section) > chunk_size and current:
            # Save current chunk
            start = text.find(current)
            chunks.append(ChunkData(
                id=_chunk_id(current, chunk_index),
                text=current,
                index=chunk_index,
                start_char=max(0, start),
                end_char=start + len(current),
                metadata={"method": "markdown", "has_headers": "#" in current},
            ))
            chunk_index += 1

            # Overlap
            if overlap > 0:
                current = current[-overlap:] + "\n\n" + section
            else:
                current = section
        else:
            current = current + "\n\n" + section if current else section

    # Final chunk
    if current:
        start = text.find(current)
        chunks.append(ChunkData(
            id=_chunk_id(current, chunk_index),
            text=current,
            index=chunk_index,
            start_char=max(0, start),
            end_char=start + len(current),
            metadata={"method": "markdown", "has_headers": "#" in current},
        ))

    return chunks


# ─── 4. Token-Based Splitting ─────────────────────────────────────

def chunk_token(text: str, chunk_size: int = 500, overlap: int = 50) -> List[ChunkData]:
    """Split by approximate token count (~4 chars per token)."""
    try:
        import tiktoken
        enc = tiktoken.get_encoding("cl100k_base")
        tokens = enc.encode(text)
        token_to_char = {}
        decoded = ""
        for i, token_id in enumerate(tokens):
            decoded += enc.decode([token_id])
            token_to_char[i] = len(decoded)
    except ImportError:
        # Fallback: approximate tokenization
        tokens = text.split()
        token_to_char = {}
        pos = 0
        for i, word in enumerate(tokens):
            token_to_char[i] = text.find(word, pos) + len(word)
            pos = token_to_char[i]

    chunks = []
    chunk_index = 0
    i = 0

    while i < len(tokens):
        end = min(i + chunk_size, len(tokens))
        chunk_tokens = tokens[i:end]

        if hasattr(enc, 'decode'):
            chunk_text = enc.decode(chunk_tokens)
        else:
            chunk_text = " ".join(chunk_tokens)

        start_char = token_to_char.get(i, 0)
        end_char = token_to_char.get(end - 1, len(text))

        chunks.append(ChunkData(
            id=_chunk_id(chunk_text, chunk_index),
            text=chunk_text.strip(),
            index=chunk_index,
            start_char=start_char,
            end_char=min(end_char, len(text)),
            metadata={"method": "token", "token_count": len(chunk_tokens)},
        ))
        chunk_index += 1

        # Move forward by chunk_size - overlap
        step = max(1, chunk_size - overlap)
        i += step

    return chunks


# ─── 5. Semantic Splitting ────────────────────────────────────────

def chunk_semantic(text: str, chunk_size: int = 500, overlap: int = 50) -> List[ChunkData]:
    """Split by semantic boundaries (paragraphs, topic shifts)."""
    # First split into paragraphs
    paragraphs = re.split(r'\n\s*\n', text)

    # Try to find semantic breaks using sentence similarity
    chunks = []
    current = ""
    chunk_index = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current) + len(para) > chunk_size and current:
            # Check if this is a good break point
            current_sentences = current.split(". ")
            para_sentences = para.split(". ")

            # Score the break: prefer breaks between sentences with different topics
            break_score = 0
            if current_sentences and para_sentences:
                last_sent = current_sentences[-1].lower()
                first_sent = para_sentences[0].lower()
                # Simple heuristic: different starting words = topic shift
                last_words = set(last_sent.split()[:5])
                first_words = set(first_sent.split()[:5])
                overlap_words = last_words & first_words
                break_score = len(overlap_words)

            start = text.find(current)
            chunks.append(ChunkData(
                id=_chunk_id(current, chunk_index),
                text=current,
                index=chunk_index,
                start_char=max(0, start),
                end_char=start + len(current),
                metadata={
                    "method": "semantic",
                    "break_score": break_score,
                    "paragraphs_merged": current.count("\n\n") + 1,
                },
            ))
            chunk_index += 1

            if overlap > 0:
                # Keep last paragraph as overlap
                current = current.split("\n\n")[-1] + "\n\n" + para if "\n\n" in current else para
            else:
                current = para
        else:
            current = current + "\n\n" + para if current else para

    if current:
        start = text.find(current)
        chunks.append(ChunkData(
            id=_chunk_id(current, chunk_index),
            text=current,
            index=chunk_index,
            start_char=max(0, start),
            end_char=start + len(current),
            metadata={"method": "semantic", "paragraphs_merged": current.count("\n\n") + 1},
        ))

    return chunks


# ─── 6. Sliding Window Splitting ──────────────────────────────────

def chunk_sliding_window(text: str, chunk_size: int = 500, overlap: int = 50) -> List[ChunkData]:
    """Fixed-size sliding window with character-level overlap."""
    chunks = []
    chunk_index = 0
    step = chunk_size - overlap

    if step <= 0:
        step = chunk_size // 2

    pos = 0
    while pos < len(text):
        end = min(pos + chunk_size, len(text))
        chunk_text = text[pos:end]

        chunks.append(ChunkData(
            id=_chunk_id(chunk_text, chunk_index),
            text=chunk_text.strip(),
            index=chunk_index,
            start_char=pos,
            end_char=end,
            metadata={
                "method": "sliding_window",
                "window_size": chunk_size,
                "step_size": step,
            },
        ))
        chunk_index += 1
        pos += step

    return chunks


# ─── 7. Parent-Child Splitting ────────────────────────────────────

def chunk_parent_child(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50,
    parent_chunk_size: int = 2000,
    child_chunk_size: int = 200
) -> List[ChunkData]:
    """Create hierarchical parent-child chunks for better retrieval."""
    # First create large parent chunks
    parent_chunks = chunk_recursive(text, chunk_size=parent_chunk_size, overlap=0)

    all_chunks = []
    chunk_index = 0

    for parent in parent_chunks:
        # Add parent chunk
        all_chunks.append(ChunkData(
            id=parent.id,
            text=parent.text,
            index=chunk_index,
            start_char=parent.start_char,
            end_char=parent.end_char,
            metadata={
                "method": "parent_child",
                "level": "parent",
                "child_count": 0,
            },
        ))
        chunk_index += 1

        # Create child chunks within this parent
        children = chunk_recursive(parent.text, chunk_size=child_chunk_size, overlap=overlap)
        for child in children:
            all_chunks.append(ChunkData(
                id=child.id,
                text=child.text,
                index=chunk_index,
                start_char=parent.start_char + child.start_char,
                end_char=parent.start_char + child.end_char,
                metadata={
                    "method": "parent_child",
                    "level": "child",
                    "parent_id": parent.id,
                },
                parent_id=parent.id,
            ))
            chunk_index += 1

    # Update parent metadata with child counts
    parent_ids = {c.id for c in all_chunks if c.metadata.get("level") == "parent"}
    for chunk in all_chunks:
        if chunk.id in parent_ids:
            child_count = sum(
                1 for c in all_chunks
                if c.metadata.get("level") == "child" and c.parent_id == chunk.id
            )
            chunk.metadata["child_count"] = child_count

    return all_chunks





# ─── Main Chunking Function ───────────────────────────────────────

def chunk_text(
    text: str,
    method: str = "recursive",
    chunk_size: int = 500,
    overlap: int = 50,
    parent_chunk_size: int = 2000,
    child_chunk_size: int = 200,
) -> Dict[str, Any]:
    """
    Main entry point for text chunking.
    Returns chunks with metadata.
    """
    if not text or not text.strip():
        return {
            "success": False,
            "chunks": [],
            "count": 0,
            "method": method,
            "error": "Empty text provided",
        }

    method_map = {
        "recursive": lambda: chunk_recursive(text, chunk_size, overlap),
        "sentence": lambda: chunk_sentence(text, chunk_size, overlap),
        "markdown": lambda: chunk_markdown(text, chunk_size, overlap),
        "token": lambda: chunk_token(text, chunk_size, overlap),
        "semantic": lambda: chunk_semantic(text, chunk_size, overlap),
        "sliding_window": lambda: chunk_sliding_window(text, chunk_size, overlap),
        "parent_child": lambda: chunk_parent_child(
            text, chunk_size, overlap, parent_chunk_size, child_chunk_size
        ),
    }

    chunker = method_map.get(method)
    if not chunker:
        return {
            "success": False,
            "chunks": [],
            "count": 0,
            "method": method,
            "error": f"Unknown chunking method: {method}",
        }

    try:
        chunks = chunker()
        chunk_sizes = [len(c.text) for c in chunks]

        return {
            "success": True,
            "chunks": [
                {
                    "id": c.id,
                    "text": c.text,
                    "index": c.index,
                    "start_char": c.start_char,
                    "end_char": c.end_char,
                    "metadata": c.metadata,
                    "parent_id": c.parent_id,
                    "char_count": len(c.text),
                    "word_count": len(c.text.split()),
                }
                for c in chunks
            ],
            "count": len(chunks),
            "method": method,
            "chunk_size": chunk_size,
            "overlap": overlap,
            "total_chars": len(text),
            "avg_chunk_size": sum(chunk_sizes) / len(chunk_sizes) if chunk_sizes else 0,
            "min_chunk_size": min(chunk_sizes) if chunk_sizes else 0,
            "max_chunk_size": max(chunk_sizes) if chunk_sizes else 0,
        }
    except Exception as e:
        return {
            "success": False,
            "chunks": [],
            "count": 0,
            "method": method,
            "error": str(e),
        }
