"""
RAGStudio MCP Server
Exposes the complete RAG pipeline as MCP tools backed by ChromaDB, FAISS, or Qdrant.

This server implements the Model Context Protocol (MCP) to provide:
- Semantic document retrieval as an MCP tool
- Dynamic knowledge access via MCP resources
- Pluggable vector database backends (ChromaDB, FAISS, Qdrant, Pinecone)

Usage:
    # stdio transport (for Claude Desktop, local tools)
    python mcp_server.py

    # HTTP transport (for web apps, multi-client)
    python mcp_server.py --http 9000
"""

import json
import os
import sys
import time
from typing import Optional

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print("MCP SDK not installed. Install with: pip install mcp")
    print("Falling back to standalone mode...")
    FastMCP = None

# Import existing RAG modules
from embeddings import generate_embeddings, generate_query_embedding, get_all_models
from vectorstore import VectorStoreManager
from retrieval import rerank_results, hybrid_search as _hybrid_search, keyword_search
from chunkers import chunk_text
from parsers import parse_file
from llm import LLMGenerator


# ═══════════════════════════════════════════════════════════════════
#  MCP SERVER INITIALIZATION
# ═══════════════════════════════════════════════════════════════════

if FastMCP is None:
    print("ERROR: Cannot start MCP server without 'mcp' package.")
    print("Install with: pip install mcp")
    sys.exit(1)

mcp = FastMCP(
    "RAGStudio MCP Server",
    version="2.0.0",
    description=(
        "Semantic document retrieval as an MCP tool. "
        "Backed by ChromaDB, FAISS, or Qdrant vector databases. "
        "Supports document ingestion, chunking, embedding, search, and RAG generation."
    )
)

# Initialize existing components
vector_manager = VectorStoreManager()
llm_generator = LLMGenerator()


# ═══════════════════════════════════════════════════════════════════
#  MCP TOOLS — Actions the LLM can take
# ═══════════════════════════════════════════════════════════════════

@mcp.tool()
def vector_search(
    query: str,
    top_k: int = 5,
    collection: str = "default",
    store_type: str = "faiss_flat",
    embedding_model: str = "all-MiniLM-L6-v2",
    use_reranker: bool = True
) -> str:
    """Search the document knowledge base semantically.

    Use this tool when the user asks a question about the documents.
    The query should be the user's question or a reformulated search query.

    Args:
        query: The search query (user's question)
        top_k: Number of results to return (default 5)
        collection: Which document collection to search
        store_type: Vector store backend (faiss_flat, faiss_hnsw, chromadb)
        embedding_model: Model to use for query embedding
        use_reranker: Whether to rerank results for better relevance

    Returns:
        Ranked document chunks with similarity scores
    """
    start = time.time()

    # Step 1: Generate query embedding
    embed_result = generate_query_embedding(query, embedding_model)
    if not embed_result.success:
        return f"Error: Embedding failed - {embed_result.error}"

    # Step 2: Search vector store
    store = vector_manager.get_store(store_type, collection)
    raw_results = store.search(
        embed_result.embeddings[0],
        top_k * 2 if use_reranker else top_k
    )

    # Step 3: Rerank if requested
    if use_reranker and raw_results:
        results = rerank_results(query, raw_results, method="keyword_overlap")
        results = results[:top_k]
    else:
        results = raw_results[:top_k]

    elapsed = (time.time() - start) * 1000

    if not results:
        return f"No results found for '{query}' in collection '{collection}'."

    output_parts = [f"Found {len(results)} relevant chunks ({elapsed:.0f}ms):\n"]
    for i, r in enumerate(results, 1):
        score = r.get("score", 0)
        text = r.get("text", "")
        source = r.get("metadata", {}).get("source", "unknown")
        output_parts.append(
            f"--- Result {i} ({score:.1%} relevance) ---\n"
            f"Source: {source}\n"
            f"Content: {text}\n"
        )

    return "\n".join(output_parts)


@mcp.tool()
def store_document(
    text: str,
    collection: str = "default",
    store_type: str = "faiss_flat",
    chunk_method: str = "recursive",
    chunk_size: int = 500,
    overlap: int = 50,
    embedding_model: str = "all-MiniLM-L6-v2",
) -> str:
    """Add a document to the knowledge base.

    Automatically chunks the text, generates embeddings, and stores vectors.
    Use this when the user wants to add new information to the knowledge base.

    Args:
        text: The document text to store
        collection: Which collection to store in
        store_type: Vector store backend
        chunk_method: Chunking strategy (recursive, sentence, markdown, token, semantic, sliding_window, parent_child)
        chunk_size: Target size for each chunk in characters
        overlap: Overlap between chunks in characters
        embedding_model: Model to use for generating embeddings

    Returns:
        Confirmation with chunk count and storage details
    """
    start = time.time()

    # Step 1: Chunk the text
    chunk_result = chunk_text(
        text=text,
        method=chunk_method,
        chunk_size=chunk_size,
        overlap=overlap,
    )
    if not chunk_result.get("success"):
        return f"Error: Chunking failed - {chunk_result.get('error')}"

    chunks = chunk_result.get("chunks", [])
    chunk_texts = [c["text"] for c in chunks]
    chunk_ids = [c["id"] for c in chunks]
    chunk_metadata = [c.get("metadata", {}) for c in chunks]

    # Step 2: Generate embeddings
    embed_result = generate_embeddings(chunk_texts, embedding_model)
    if not embed_result.success:
        return f"Error: Embedding failed - {embed_result.error}"

    # Step 3: Store vectors
    store = vector_manager.get_store(store_type, collection, embed_result.dimensions)
    store.add(chunk_ids, embed_result.embeddings, chunk_metadata, texts=chunk_texts)

    elapsed = (time.time() - start) * 1000

    return (
        f"Document stored successfully!\n"
        f"- Chunks created: {len(chunks)}\n"
        f"- Embedding dimensions: {embed_result.dimensions}\n"
        f"- Collection: {collection}\n"
        f"- Store type: {store_type}\n"
        f"- Total vectors in collection: {store.count()}\n"
        f"- Processing time: {elapsed:.0f}ms"
    )


@mcp.tool()
def ingest_file(
    file_path: str,
    collection: str = "default",
    store_type: str = "faiss_flat",
    chunk_method: str = "recursive",
    chunk_size: int = 500,
    overlap: int = 50,
    embedding_model: str = "all-MiniLM-L6-v2"
) -> str:
    """Parse a file and ingest it into the knowledge base.

    Supports PDF, DOCX, XLSX, PPTX, CSV, TXT, Markdown, HTML, JSON, XML, images, ZIP.
    Automatically parses, chunks, embeds, and stores.

    Args:
        file_path: Path to the file to ingest
        collection: Which collection to store in
        store_type: Vector store backend
        chunk_method: Chunking strategy
        chunk_size: Target chunk size
        overlap: Chunk overlap
        embedding_model: Embedding model to use

    Returns:
        Ingestion summary with file stats, chunk count, and storage details
    """
    start = time.time()

    # Step 1: Parse the file
    parse_result = parse_file(file_path)
    if not parse_result.get("success"):
        return f"Error: Parsing failed - {parse_result.get('error')}"

    text = parse_result.get("text", "")
    file_name = parse_result.get("file_name", "unknown")
    file_type = parse_result.get("file_type", "unknown")

    # Step 2: Chunk + Embed + Store
    chunk_result = chunk_text(
        text=text, method=chunk_method,
        chunk_size=chunk_size, overlap=overlap,
    )
    if not chunk_result.get("success"):
        return f"Error: Chunking failed - {chunk_result.get('error')}"

    chunks = chunk_result.get("chunks", [])
    chunk_texts = [c["text"] for c in chunks]
    chunk_ids = [c["id"] for c in chunks]

    embed_result = generate_embeddings(chunk_texts, embedding_model)
    if not embed_result.success:
        return f"Error: Embedding failed - {embed_result.error}"

    store = vector_manager.get_store(store_type, collection, embed_result.dimensions)
    store.add(
        chunk_ids, embed_result.embeddings,
        [{"source": file_name, "file_type": file_type} for _ in chunks],
        texts=chunk_texts
    )

    elapsed = (time.time() - start) * 1000

    return (
        f"File ingested successfully!\n"
        f"- File: {file_name} ({file_type})\n"
        f"- Characters: {parse_result.get('characters', len(text))}\n"
        f"- Words: {parse_result.get('words', len(text.split()))}\n"
        f"- Chunks created: {len(chunks)}\n"
        f"- Embedding dimensions: {embed_result.dimensions}\n"
        f"- Total vectors in collection: {store.count()}\n"
        f"- Total ingestion time: {elapsed:.0f}ms"
    )


@mcp.tool()
def list_collections() -> str:
    """List all available document collections with their statistics.

    Use this to discover what data is available in the knowledge base.
    """
    stores = vector_manager.list_stores()
    if not stores:
        return "No collections found. Use store_document or ingest_file to add documents."

    output_parts = [f"Found {len(stores)} collection(s):\n"]
    for store_info in stores:
        output_parts.append(
            f"- {store_info.get('collection', 'default')} "
            f"({store_info.get('store_type', 'unknown')}): "
            f"{store_info.get('count', 0)} vectors"
        )

    return "\n".join(output_parts)


@mcp.tool()
def get_collection_stats(
    collection: str = "default",
    store_type: str = "faiss_flat"
) -> str:
    """Get detailed statistics about a document collection.

    Args:
        collection: Collection name
        store_type: Vector store backend
    """
    store = vector_manager.get_store(store_type, collection)
    stats = store.stats()
    return json.dumps(stats, indent=2)


@mcp.tool()
def delete_collection(
    collection: str,
    store_type: str = "faiss_flat"
) -> str:
    """Delete an entire document collection permanently.

    WARNING: This removes all vectors and metadata.

    Args:
        collection: Collection name to delete
        store_type: Vector store backend
    """
    vector_manager.delete_store(store_type, collection)
    return f"Collection '{collection}' ({store_type}) deleted successfully."


@mcp.tool()
def generate_answer(
    query: str,
    context: str,
    provider: str = "groq",
    model: str = "llama-3.1-8b-instant",
    api_key: Optional[str] = None,
    system_prompt: Optional[str] = None
) -> str:
    """Generate an answer using an LLM with retrieved context.

    Use this after vector_search to generate a grounded answer.

    Args:
        query: The user's original question
        context: The retrieved context from vector_search (paste the chunk texts)
        provider: LLM provider (groq, openai, ollama, huggingface, openrouter)
        model: Model identifier
        api_key: API key for cloud providers
        system_prompt: Optional custom system prompt

    Returns:
        Generated answer with token usage and timing
    """
    context_list = [c.strip() for c in context.split("---") if c.strip()]

    result = llm_generator.generate(
        query=query,
        context=context_list,
        provider=provider,
        model=model,
        api_key=api_key,
        system_prompt=system_prompt,
    )

    if result.get("success"):
        return (
            f"Answer: {result['answer']}\n\n"
            f"Model: {result['model']} via {result['provider']}\n"
            f"Tokens: {result.get('total_tokens', 0)} "
            f"(prompt: {result.get('prompt_tokens', 0)}, "
            f"completion: {result.get('completion_tokens', 0)})\n"
            f"Generation time: {result.get('total_time_ms', 0):.0f}ms"
        )
    else:
        return f"Generation failed: {result.get('error', 'Unknown error')}"


@mcp.tool()
def list_embedding_models() -> str:
    """List all available embedding models with dimensions, size, and quality ratings."""
    models = get_all_models()
    output_parts = [f"Available embedding models ({len(models)}):\n"]
    for m in models:
        output_parts.append(
            f"- {m.get('display_name', m.get('name', 'unknown'))}: "
            f"{m.get('dimensions', '?')}d, "
            f"{m.get('size_mb', '?')}MB, "
            f"Quality: {m.get('quality', '?')}, "
            f"Speed: {m.get('speed', '?')}"
        )
    return "\n".join(output_parts)


# ═══════════════════════════════════════════════════════════════════
#  MCP RESOURCES — Data the LLM can read
# ═══════════════════════════════════════════════════════════════════

@mcp.resource("rag://collections")
def get_all_collections_resource() -> str:
    """List all document collections as JSON."""
    stores = vector_manager.list_stores()
    return json.dumps(stores, indent=2)


@mcp.resource("rag://collections/{collection}/stats")
def get_collection_stats_resource(collection: str) -> str:
    """Get stats for a specific collection."""
    store = vector_manager.get_store("faiss_flat", collection)
    return json.dumps(store.stats(), indent=2)


@mcp.resource("rag://models/embedding")
def get_embedding_models_resource() -> str:
    """List available embedding models."""
    return json.dumps(get_all_models(), indent=2)


@mcp.resource("rag://health")
def get_health_resource() -> str:
    """MCP server health check."""
    ollama_ok = llm_generator.ollama.is_available()
    return json.dumps({
        "status": "healthy",
        "version": "2.0.0",
        "ollama_available": ollama_ok,
        "collections": len(vector_manager.list_stores()),
    })


# ═══════════════════════════════════════════════════════════════════
#  MCP PROMPTS — Templates for interaction
# ═══════════════════════════════════════════════════════════════════

@mcp.prompt()
def rag_question_answer(question: str) -> str:
    """Template for answering questions using RAG retrieval."""
    return (
        f"You are a helpful assistant that answers questions using a document knowledge base.\n\n"
        f"Question: {question}\n\n"
        f"Instructions:\n"
        f"1. Use the `vector_search` tool to find relevant document chunks for: \"{question}\"\n"
        f"2. Review the retrieved chunks carefully\n"
        f"3. Generate an answer based ONLY on the retrieved context\n"
        f"4. If the context doesn't contain enough information, clearly state what's missing\n"
        f"5. Cite specific chunks when possible\n\n"
        f"Start by using vector_search to find relevant context."
    )


@mcp.prompt()
def ingest_document_prompt(document_text: str, document_name: str = "unnamed") -> str:
    """Template for ingesting a new document into the knowledge base."""
    preview = document_text[:300] + "..." if len(document_text) > 300 else document_text
    return (
        f"You are a document ingestion assistant.\n\n"
        f"Document name: {document_name}\n"
        f"Preview: {preview}\n\n"
        f"Instructions:\n"
        f"1. Use `store_document` to add this document to the knowledge base\n"
        f"2. Confirm the chunk count and collection statistics\n"
        f"3. Verify the ingestion was successful using `get_collection_stats`\n\n"
        f"Use `store_document` with the full document text to begin ingestion."
    )


@mcp.prompt()
def compare_documents(collection_a: str, collection_b: str) -> str:
    """Template for comparing two document collections."""
    return (
        f"You are a document analysis assistant.\n\n"
        f"Compare collections: {collection_a} and {collection_b}\n\n"
        f"Instructions:\n"
        f"1. Use `get_collection_stats` on both collections\n"
        f"2. Summarize the differences in size, content type, and structure\n"
        f"3. Use `list_collections` to see overall knowledge base structure"
    )


# ═══════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    if "--http" in sys.argv:
        idx = sys.argv.index("--http")
        port = int(sys.argv[idx + 1]) if idx + 1 < len(sys.argv) else 9000
        print(f"[RAGStudio MCP] Starting HTTP server on port {port}...")
        print(f"[RAGStudio MCP] Endpoint: http://127.0.0.1:{port}/mcp")
        mcp.run(transport="http", host="127.0.0.1", port=port)
    else:
        print("[RAGStudio MCP] Starting stdio server...")
        print("[RAGStudio MCP] Connect via Claude Desktop or MCP Inspector")
        mcp.run()
