# RAG MCP Server — Semantic Document Retrieval as an MCP Tool

## Complete Theory & Implementation Guide for RAGStudio

---

## Table of Contents

1. [What is MCP (Model Context Protocol)](#1-what-is-mcp)
2. [MCP Architecture Deep Dive](#2-mcp-architecture)
3. [RAG + MCP: Why They're Better Together](#3-rag-plus-mcp)
4. [RAG MCP Server Architecture](#4-rag-mcp-server-architecture)
5. [How MCP Separates Retrieval from LLM](#5-separation-of-concerns)
6. [Dynamic Knowledge Access via MCP](#6-dynamic-knowledge-access)
7. [Implementation Guide for RAGStudio](#7-implementation-guide)
8. [Practical Code Examples](#8-practical-code)
9. [Vector Database Backends: ChromaDB, Qdrant, Pinecone](#9-vector-databases)
10. [Testing & Deployment](#10-testing-deployment)

---

## 1. What is MCP (Model Context Protocol) {#1-what-is-mcp}

### Definition

The **Model Context Protocol (MCP)** is an open-source, vendor-neutral protocol created by **Anthropic** that provides a standardized way for AI applications (LLMs) to connect to external data, tools, and systems. Think of it as the **"USB-C port for AI"** — one universal connector that works with everything.

### The Problem MCP Solves

Before MCP, every AI application needed **custom integrations** for every data source:

```
Without MCP (N × M problem):
  LLM App 1 → Custom ChromaDB adapter
  LLM App 1 → Custom Qdrant adapter
  LLM App 1 → Custom Pinecone adapter
  LLM App 2 → Custom ChromaDB adapter (duplicate!)
  LLM App 2 → Custom Qdrant adapter (duplicate!)
  ... (exponential duplication)
```

```
With MCP (N + M solution):
  LLM App 1 → MCP Client ─┐
  LLM App 2 → MCP Client ─┤
  LLM App 3 → MCP Client ─┤
                           ├── MCP Protocol (JSON-RPC 2.0)
                           │
  ChromaDB MCP Server ─────┤
  Qdrant MCP Server ───────┤
  Pinecone MCP Server ─────┘
```

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Standardization** | One protocol, any AI app, any data source |
| **Decoupling** | LLM doesn't know or care about the underlying database |
| **Discoverability** | LLMs can discover available tools at runtime |
| **Composability** | Multiple MCP servers can be combined in one session |
| **Security** | Server controls what data/tools are exposed |

---

## 2. MCP Architecture Deep Dive {#2-mcp-architecture}

### The Three Roles

```
┌─────────────────────────────────────────────────────────┐
│                    MCP HOST                              │
│  (e.g., Claude Desktop, RAGStudio, Custom Agent)        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  MCP Client  │  │  MCP Client  │  │  MCP Client  │  │
│  │  (ChromaDB)  │  │  (Qdrant)    │  │  (Pinecone)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
     ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
     │ MCP     │       │ MCP     │       │ MCP     │
     │ Server  │       │ Server  │       │ Server  │
     │(Chroma) │       │(Qdrant) │       │(Pinecone│
     └────┬────┘       └────┬────┘       └────┬────┘
          │                  │                  │
     ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
     │ChromaDB │       │ Qdrant  │       │Pinecone │
     │Database │       │Database │       │Database │
     └─────────┘       └─────────┘       └─────────┘
```

### MCP Primitives (The Three Building Blocks)

#### 1. Tools (Actions the LLM can TAKE)

Tools are **executable functions** that the LLM can invoke. They represent **actions** — things the AI can *do*.

```python
# Example: A vector search tool
@mcp.tool()
def vector_search(query: str, top_k: int = 5) -> str:
    """Search the document database for relevant content.
    
    Use this tool when the user asks a question about the documents.
    The query should be the user's question rewritten for semantic search.
    """
    results = collection.query(query_texts=[query], n_results=top_k)
    return "\n\n".join(results["documents"][0])
```

**Key properties:**
- `name`: Unique identifier (e.g., `vector_search`)
- `description`: Natural language description (LLM reads this to decide when to use it!)
- `inputSchema`: JSON Schema defining expected parameters
- Returns: Text content the LLM receives as context

#### 2. Resources (Data the LLM can READ)

Resources are **read-only data sources** that provide context. They represent **information** — things the AI can *know*.

```python
# Example: Exposing a document chunk as a resource
@mcp.resource("rag://documents/{collection}/{chunk_id}")
def get_document_chunk(collection: str, chunk_id: str) -> str:
    """Retrieve a specific document chunk by ID."""
    chunk = collection.get(ids=[chunk_id])
    return chunk["documents"][0] if chunk["documents"] else "Not found"
```

**Key properties:**
- Identified by URI (e.g., `rag://documents/default/chunk_42`)
- Has a MIME type (e.g., `text/plain`, `application/json`)
- Read-only — the LLM reads data, doesn't modify it

#### 3. Prompts (Templates for Interaction)

Prompts are **reusable instruction templates** that guide the LLM's behavior.

```python
# Example: A RAG-specific prompt template
@mcp.prompt()
def rag_query_prompt(question: str) -> str:
    """Template for answering questions using RAG."""
    return f"""You are a helpful assistant. Answer the following question 
    using ONLY the provided context. If the context doesn't contain 
    enough information, say so clearly.
    
    Question: {question}
    
    Use the vector_search tool to find relevant context first."""
```

### Communication Protocol

MCP uses **JSON-RPC 2.0** over two transport options:

| Transport | Use Case | How It Works |
|-----------|----------|--------------|
| **stdio** | Local development, CLI tools, Claude Desktop | Server reads from stdin, writes to stdout |
| **HTTP/SSE** | Remote servers, web apps, multi-client | Server runs as HTTP endpoint with Server-Sent Events |

### Connection Lifecycle

```
Step 1: INITIALIZE
  Client → Server: {"jsonrpc": "2.0", "method": "initialize", "params": {"capabilities": {...}}}
  Server → Client: {"jsonrpc": "2.0", "result": {"capabilities": {"tools": true, "resources": true}}}

Step 2: INITIALIZED (handshake complete)
  Client → Server: {"jsonrpc": "2.0", "method": "notifications/initialized"}

Step 3: DISCOVERY (what can I do?)
  Client → Server: {"jsonrpc": "2.0", "method": "tools/list"}
  Server → Client: {"tools": [{"name": "vector_search", "description": "...", "inputSchema": {...}}]}

Step 4: EXECUTION (do the thing)
  Client → Server: {"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "vector_search", "arguments": {"query": "What is AI?"}}}
  Server → Client: {"content": [{"type": "text", "text": "AI is..."}]}
```

---

## 3. RAG + MCP: Why They're Better Together {#3-rag-plus-mcp}

### What is RAG?

**Retrieval-Augmented Generation (RAG)** is a technique that enhances LLM responses by:

1. **Retrieving** relevant documents from a knowledge base
2. **Augmenting** the LLM prompt with that context
3. **Generating** a response grounded in real data

```
Traditional LLM:
  User: "What is Tara's revenue?"
  LLM: "I don't have access to current financial data." ❌

RAG-Enhanced LLM:
  User: "What is Tara's revenue?"
  Step 1: Search vector DB for "Tara revenue"
  Step 2: Found: "Tara reported $50M revenue in Q4 2024..."
  Step 3: LLM: "According to the Q4 2024 report, Tara's revenue was $50M." ✅
```

### The Missing Piece: Standardization

Traditional RAG works, but every implementation is **custom and tightly coupled**:

```
Traditional RAG (Tightly Coupled):
  ┌─────────────────────────────────────┐
  │           Your RAG App              │
  │  ┌─────────┐  ┌──────────────────┐  │
  │  │  LLM    │←→│ Custom ChromaDB  │  │
  │  │         │  │ Adapter Code     │  │
  │  └─────────┘  └──────────────────┘  │
  │       ↕              ↕              │
  │  ┌─────────┐  ┌──────────────────┐  │
  │  │ Prompt  │  │ Custom Embedding │  │
  │  │ Builder │  │ Pipeline         │  │
  │  └─────────┘  └──────────────────┘  │
  └─────────────────────────────────────┘
  Problem: Everything is interdependent!
```

```
RAG + MCP (Decoupled):
  ┌──────────────────┐     ┌──────────────────┐
  │    Your App      │     │  MCP RAG Server   │
  │  ┌────────────┐  │     │  ┌──────────────┐ │
  │  │    LLM     │←─┼─MCP─┼─→│ Vector Search │ │
  │  └────────────┘  │     │  └──────────────┘ │
  │  ┌────────────┐  │     │  ┌──────────────┐ │
  │  │ MCP Client │←─┼─────┼─→│ Embed Engine  │ │
  │  └────────────┘  │     │  └──────────────┘ │
  └──────────────────┘     │  ┌──────────────┐ │
                           │  │ ChromaDB/Qdrant│ │
                           │  │ /Pinecone     │ │
                           │  └──────────────┘ │
                           └──────────────────┘
  Benefit: Swap any component independently!
```

### The Synergy

| Aspect | RAG Alone | RAG + MCP |
|--------|-----------|-----------|
| **Data Access** | Custom code per DB | Standardized MCP tools |
| **LLM Integration** | Tight coupling | Loose coupling via protocol |
| **Multi-DB Support** | Rewrite adapter code | Plug in MCP server per DB |
| **Tool Discovery** | Hardcoded | Runtime discovery |
| **Action Capability** | Read only | Read + Write + Execute |
| **Reusability** | App-specific | Any MCP-compatible app |
| **Testing** | Integration tests per app | Standard MCP Inspector |

---

## 4. RAG MCP Server Architecture {#4-rag-mcp-server-architecture}

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAG MCP SERVER                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 MCP Protocol Layer                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │  Tools   │  │Resources │  │ Prompts  │              │    │
│  │  │ Registry │  │ Registry │  │ Registry │              │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘              │    │
│  └───────┼──────────────┼──────────────┼───────────────────┘    │
│          │              │              │                         │
│  ┌───────▼──────────────▼──────────────▼───────────────────┐    │
│  │              RAG Engine Layer                            │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │    │
│  │  │  Embedding   │ │  Retrieval   │ │  Generation  │    │    │
│  │  │  Engine      │ │  Engine      │ │  Engine      │    │    │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘    │    │
│  └─────────┼────────────────┼────────────────┼─────────────┘    │
│            │                │                │                    │
│  ┌─────────▼────────────────▼────────────────▼─────────────┐    │
│  │              Storage Layer (Pluggable)                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │ ChromaDB │  │  Qdrant  │  │ Pinecone │              │    │
│  │  │ Adapter  │  │  Adapter │  │  Adapter │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Exposed MCP Tools

| Tool Name | Description | Input | Output |
|-----------|-------------|-------|--------|
| `vector_search` | Semantic search across documents | `query`, `top_k`, `collection`, `filters` | Ranked document chunks with scores |
| `store_document` | Ingest a new document into the knowledge base | `text`, `metadata`, `collection` | Storage confirmation with chunk count |
| `list_collections` | List all available document collections | (none) | Collection names and stats |
| `get_document_stats` | Get statistics for a collection | `collection` | Vector count, dimensions, last updated |
| `delete_document` | Remove a document from the knowledge base | `document_id`, `collection` | Deletion confirmation |
| `hybrid_search` | Combined semantic + keyword search | `query`, `top_k`, `keyword_weight` | Merged ranked results |
| `generate_answer` | RAG generation with retrieved context | `query`, `context_chunks` | Generated answer with citations |

### Exposed MCP Resources

| Resource URI | Description | MIME Type |
|-------------|-------------|-----------|
| `rag://collections` | List of all collections | `application/json` |
| `rag://collections/{name}/stats` | Collection statistics | `application/json` |
| `rag://collections/{name}/chunks/{id}` | Individual document chunk | `text/plain` |
| `rag://collections/{name}/chunks` | All chunks in a collection | `application/json` |

---

## 5. How MCP Separates Retrieval from LLM {#5-separation-of-concerns}

### The Separation Principle

MCP creates a **clean boundary** between three concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    SEPARATION OF CONCERNS                 │
│                                                          │
│  1. INTELLIGENCE (LLM Layer)                             │
│     - Understanding user intent                          │
│     - Reasoning over retrieved context                   │
│     - Generating natural language responses              │
│     - Deciding which tools to use                        │
│     ⚠️ Does NOT know about databases, embeddings,        │
│        or vector operations                              │
│                                                          │
│  2. ORCHESTRATION (MCP Protocol Layer)                   │
│     - Tool discovery and registration                    │
│     - Request routing (JSON-RPC)                         │
│     - Capability negotiation                             │
│     - Error handling and timeouts                        │
│     ⚠️ Does NOT know about specific DB implementations   │
│                                                          │
│  3. INFRASTRUCTURE (Storage Layer)                       │
│     - Vector storage and indexing                        │
│     - Embedding generation                               │
│     - Similarity search algorithms                       │
│     - Persistence and caching                            │
│     ⚠️ Does NOT know about the LLM or its requirements   │
└─────────────────────────────────────────────────────────┘
```

### How the LLM "Discovers" Retrieval

When an MCP client connects to a RAG MCP server, the LLM learns about retrieval capabilities **dynamically**:

```
1. LLM connects to RAG MCP Server

2. Server announces available tools:
   - "vector_search": "Search documents semantically"
   - "store_document": "Add new documents to the knowledge base"

3. User asks: "What is Tara's mission?"

4. LLM reasons: "I need to search for information about Tara's mission.
   I'll use the vector_search tool."

5. LLM calls: vector_search(query="Tara mission statement", top_k=3)

6. Server returns: "Tara's mission is to democratize AI access..."

7. LLM generates: "Based on the retrieved documents, Tara's mission is..."

Key insight: The LLM doesn't know it's talking to ChromaDB.
It just knows it has a "vector_search" tool available.
```

### Swapping Backends Without Changing the LLM

```
Scenario: Switch from ChromaDB to Qdrant

Before (ChromaDB):
  LLM → MCP Client → ChromaDB MCP Server → ChromaDB

After (Qdrant):
  LLM → MCP Client → Qdrant MCP Server → Qdrant
  
  ✅ LLM code: UNCHANGED
  ✅ MCP Client: UNCHANGED
  ✅ Only the MCP Server was swapped!
```

---

## 6. Dynamic Knowledge Access via MCP {#6-dynamic-knowledge-access}

### What is Dynamic Knowledge Access?

Unlike static RAG (where documents are pre-indexed and the retrieval pipeline is fixed), **dynamic knowledge access** means:

1. **Runtime Discovery**: The LLM discovers available knowledge sources at connection time
2. **On-Demand Ingestion**: New documents can be added while the system is running
3. **Adaptive Retrieval**: The LLM chooses *how* to search based on the query
4. **Multi-Source Fusion**: Data from multiple MCP servers can be combined

### Dynamic vs Static RAG

```
Static RAG:
  ┌──────────┐    Fixed Pipeline    ┌──────────┐
  │  Query   │ ──────────────────→  │ Response │
  │          │  embed → search →    │          │
  │          │  rerank → generate   │          │
  └──────────┘                      └──────────┘
  ⚠️ Pipeline is hardcoded at build time

Dynamic RAG (via MCP):
  ┌──────────┐    LLM Decides      ┌──────────┐
  │  Query   │ ──────────────────→  │ Response │
  │          │                      │          │
  │  LLM:    │  "Should I search   │          │
  │  "I need │   docs? Use which   │          │
  │  to      │   tool? How many    │          │
  │  think"  │   results?"         │          │
  └──────────┘                      └──────────┘
  ✅ Pipeline is decided at runtime by the LLM
```

### Dynamic Knowledge Access Flow

```
Step 1: DISCOVERY
  LLM: "What tools do I have?"
  MCP Server: "You have vector_search, store_document, list_collections"

Step 2: ASSESSMENT
  LLM: "The user asked about Tara's revenue. I should search the financial docs."

Step 3: ADAPTIVE RETRIEVAL
  LLM: "Let me search with top_k=5 first. If results are poor, I'll try 
        different query terms or use hybrid_search."

Step 4: MULTI-SOURCE FUSION
  LLM: "I found results in Collection A. Let me also check Collection B 
        for additional context using another MCP server."

Step 5: GENERATION
  LLM: "I have enough context. Let me generate a comprehensive answer."
```

---

## 7. Implementation Guide for RAGStudio {#7-implementation-guide}

### Mapping to Your Existing Codebase

Your RAGStudio already has all the building blocks:

| Your Existing Module | MCP Equivalent | What to Expose |
|---------------------|----------------|----------------|
| `embeddings.py` | Embedding Tool | `generate_embeddings`, `generate_query_embedding` |
| `vectorstore.py` | Vector Store Tools | `search`, `add`, `delete`, `stats` |
| `retrieval.py` | Retrieval Tools | `vector_search`, `hybrid_search`, `rerank` |
| `chunkers.py` | Document Processing | `store_document` (chunk + embed + store) |
| `parsers.py` | Document Ingestion | `ingest_document` (parse + chunk + embed + store) |
| `llm.py` | Generation Tool | `generate_answer` (RAG generation) |
| `main.py` | Server Entry Point | MCP server setup and transport |

### Implementation Steps

#### Step 1: Install MCP SDK

```bash
pip install mcp
```

#### Step 2: Create MCP Server Module

Create `backend/mcp_server.py` — the central MCP server that wraps your existing modules.

#### Step 3: Define MCP Tools

Map your existing functions to MCP tools:

```python
# Tool 1: Vector Search (wraps retrieval.py + vectorstore.py)
@mcp.tool()
def vector_search(query: str, top_k: int = 5, collection: str = "default", 
                  store_type: str = "faiss_flat") -> str:
    """Search documents semantically. Use when user asks a question."""
    # Uses your existing: generate_query_embedding() + store.search() + rerank_results()

# Tool 2: Store Document (wraps chunkers.py + embeddings.py + vectorstore.py)
@mcp.tool()
def store_document(text: str, collection: str = "default", 
                   chunk_method: str = "recursive") -> str:
    """Add a document to the knowledge base. Chunks and embeds automatically."""
    # Uses your existing: chunk_text() + generate_embeddings() + store.add()

# Tool 3: List Collections (wraps vectorstore.py)
@mcp.tool()
def list_collections() -> str:
    """List all available document collections."""
    # Uses your existing: vector_manager.list_stores()

# Tool 4: Collection Stats (wraps vectorstore.py)
@mcp.tool()
def get_collection_stats(collection: str, store_type: str = "faiss_flat") -> str:
    """Get statistics about a document collection."""
    # Uses your existing: store.stats()

# Tool 5: Hybrid Search (wraps retrieval.py)
@mcp.tool()
def hybrid_search(query: str, top_k: int = 5, keyword_weight: float = 0.3) -> str:
    """Combined semantic + keyword search for better results."""
    # Uses your existing: hybrid_search()

# Tool 6: Generate Answer (wraps llm.py)
@mcp.tool()
def generate_answer(query: str, context: str, provider: str = "groq",
                    model: str = "llama-3.1-8b-instant") -> str:
    """Generate an answer using retrieved context."""
    # Uses your existing: llm_generator.generate()
```

#### Step 4: Define MCP Resources

```python
# Resource: Collection statistics
@mcp.resource("rag://collections/{name}/stats")
def get_collection_resource(name: str) -> str:
    """Get collection stats as a JSON resource."""
    store = vector_manager.get_store("faiss_flat", name)
    return json.dumps(store.stats())

# Resource: Individual document chunk
@mcp.resource("rag://collections/{name}/chunks/{chunk_id}")
def get_chunk_resource(name: str, chunk_id: str) -> str:
    """Retrieve a specific document chunk."""
    store = vector_manager.get_store("faiss_flat", name)
    results = store.search_by_id(chunk_id)
    return results.get("text", "Chunk not found")
```

#### Step 5: Define MCP Prompts

```python
# Prompt: RAG question answering
@mcp.prompt()
def rag_qa(question: str) -> str:
    """Template for answering questions using RAG."""
    return f"""Answer the following question using the vector_search tool 
    to find relevant context first, then generate a grounded answer.

    Question: {question}
    
    Steps:
    1. Use vector_search to find relevant documents
    2. Read the retrieved chunks carefully
    3. Generate an answer based ONLY on the retrieved context
    4. If context is insufficient, say so clearly"""

# Prompt: Document ingestion
@mcp.prompt()
def ingest_document(document_text: str) -> str:
    """Template for ingesting a new document."""
    return f"""Ingest the following document into the knowledge base:
    
    1. Use store_document to add the document
    2. Confirm the number of chunks created
    3. Report the collection statistics"""
```

#### Step 6: Configure Transport

```python
# Option A: stdio (for Claude Desktop, local tools)
if __name__ == "__main__":
    mcp.run()  # Defaults to stdio

# Option B: HTTP (for web apps, multi-client)
if __name__ == "__main__":
    mcp.run(transport="http", host="127.0.0.1", port=9000)
```

---

## 8. Practical Code Examples {#8-practical-code}

### Complete MCP Server Implementation

```python
"""
RAGStudio MCP Server
Exposes the complete RAG pipeline as MCP tools.
"""

import json
import os
import sys
import time
from mcp.server.fastmcp import FastMCP

# Import your existing modules
sys.path.insert(0, os.path.dirname(__file__))
from embeddings import generate_embeddings, generate_query_embedding, get_all_models
from vectorstore import VectorStoreManager
from retrieval import cosine_similarity, rerank_results, hybrid_search, keyword_search
from chunkers import chunk_text
from parsers import parse_file
from llm import LLMGenerator

# Initialize MCP Server
mcp = FastMCP(
    "RAGStudio MCP Server",
    version="2.0.0",
    description="Semantic document retrieval as an MCP tool backed by ChromaDB, FAISS, or Qdrant"
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
    raw_results = store.search(embed_result.embeddings[0], top_k * 2 if use_reranker else top_k)
    
    # Step 3: Rerank if requested
    if use_reranker and raw_results:
        results = rerank_results(query, raw_results, method="keyword_overlap")
        results = results[:top_k]
    else:
        results = raw_results[:top_k]
    
    elapsed = (time.time() - start) * 1000
    
    # Format results
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
    metadata: dict = None
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
        metadata: Optional metadata dict to attach to all chunks
    
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
    chunk_metadata = [metadata or {} for _ in chunks]
    
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
    
    # Step 2: Store (chunk + embed + store)
    store_result = store_document(
        text=text,
        collection=collection,
        store_type=store_type,
        chunk_method=chunk_method,
        chunk_size=chunk_size,
        overlap=overlap,
        embedding_model=embedding_model,
        metadata={"source": file_name, "file_type": file_type}
    )
    
    elapsed = (time.time() - start) * 1000
    
    return (
        f"File ingested successfully!\n"
        f"- File: {file_name} ({file_type})\n"
        f"- Characters: {parse_result.get('characters', len(text))}\n"
        f"- Words: {parse_result.get('words', len(text.split()))}\n"
        f"- {store_result}\n"
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
    
    Returns:
        Collection statistics including vector count, dimensions, and metadata
    """
    store = vector_manager.get_store(store_type, collection)
    stats = store.stats()
    return json.dumps(stats, indent=2)


@mcp.tool()
def delete_collection(
    collection: str = "default",
    store_type: str = "faiss_flat"
) -> str:
    """Delete an entire document collection.
    
    WARNING: This permanently removes all vectors and metadata.
    
    Args:
        collection: Collection name to delete
        store_type: Vector store backend
    """
    vector_manager.delete_store(store_type, collection)
    return f"Collection '{collection}' ({store_type}) deleted successfully."


@mcp.tool()
def generate_answer(
    query: str,
    context_chunks: str,
    provider: str = "groq",
    model: str = "llama-3.1-8b-instant",
    api_key: str = None,
    system_prompt: str = None
) -> str:
    """Generate an answer using an LLM with retrieved context.
    
    Use this after vector_search to generate a grounded answer.
    
    Args:
        query: The user's original question
        context_chunks: The retrieved context from vector_search (paste the chunks)
        provider: LLM provider (groq, openai, ollama, huggingface, openrouter)
        model: Model identifier
        api_key: API key for the provider
        system_prompt: Optional custom system prompt
    
    Returns:
        Generated answer with metadata
    """
    # Parse context chunks from the string
    context_list = [c.strip() for c in context_chunks.split("---") if c.strip()]
    
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
def hybrid_search_tool(
    query: str,
    top_k: int = 5,
    keyword_weight: float = 0.3,
    collection: str = "default",
    store_type: str = "faiss_flat",
    embedding_model: str = "all-MiniLM-L6-v2"
) -> str:
    """Combined semantic + keyword search for better relevance.
    
    Blends vector similarity with keyword matching.
    Useful when pure semantic search misses important exact terms.
    
    Args:
        query: Search query
        top_k: Number of results
        keyword_weight: Weight for keyword scoring (0.0=semantic only, 1.0=keyword only)
        collection: Collection to search
        store_type: Vector store backend
        embedding_model: Embedding model
    
    Returns:
        Merged ranked results from both semantic and keyword search
    """
    # Get semantic results
    embed_result = generate_query_embedding(query, embedding_model)
    if not embed_result.success:
        return f"Error: Embedding failed - {embed_result.error}"
    
    store = vector_manager.get_store(store_type, collection)
    semantic_results = store.search(embed_result.embeddings[0], top_k * 2)
    
    # Get keyword results
    keyword_results = keyword_search(query, store, top_k * 2)
    
    # Merge with weights
    merged = hybrid_search(
        query=query,
        semantic_results=semantic_results,
        keyword_results=keyword_results,
        semantic_weight=1 - keyword_weight,
        keyword_weight=keyword_weight,
        top_k=top_k
    )
    
    if not merged:
        return f"No results found for '{query}'."
    
    output_parts = [f"Hybrid search results ({len(merged)} found):\n"]
    for i, r in enumerate(merged, 1):
        score = r.get("score", 0)
        text = r.get("text", "")
        output_parts.append(f"--- Result {i} (score: {score:.3f}) ---\n{text}\n")
    
    return "\n".join(output_parts)


@mcp.tool()
def list_embedding_models() -> str:
    """List all available embedding models with their properties.
    
    Use this to see what embedding models are available for document processing.
    """
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
def get_all_collections() -> str:
    """Get all collections as JSON."""
    stores = vector_manager.list_stores()
    return json.dumps(stores, indent=2)


@mcp.resource("rag://collections/{collection}/stats")
def get_collection_stats_resource(collection: str) -> str:
    """Get stats for a specific collection."""
    store = vector_manager.get_store("faiss_flat", collection)
    return json.dumps(store.stats(), indent=2)


@mcp.resource("rag://models/embedding")
def get_embedding_models_resource() -> str:
    """Get available embedding models."""
    return json.dumps(get_all_models(), indent=2)


# ═══════════════════════════════════════════════════════════════════
#  MCP PROMPTS — Templates for interaction
# ═══════════════════════════════════════════════════════════════════

@mcp.prompt()
def rag_question_answer(question: str) -> str:
    """Template for answering questions using RAG retrieval."""
    return f"""You are a helpful assistant that answers questions using a document knowledge base.

Question: {question}

Instructions:
1. Use the `vector_search` tool to find relevant document chunks for: "{question}"
2. Review the retrieved chunks carefully
3. Generate an answer based ONLY on the retrieved context
4. If the context doesn't contain enough information, clearly state what's missing
5. Cite specific chunks when possible

Start by using vector_search to find relevant context."""


@mcp.prompt()
def ingest_new_document(document_text: str, document_name: str = "unnamed") -> str:
    """Template for ingesting a new document."""
    return f"""You are a document ingestion assistant.

Document name: {document_name}
Document content: {document_text[:500]}...

Instructions:
1. Use `store_document` to add this document to the knowledge base
2. Confirm the chunk count and collection statistics
3. Verify the ingestion was successful using `get_collection_stats`


Use `store_document` with the full document text to begin ingestion."""


# ═══════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    if "--http" in sys.argv:
        # Run as HTTP server for web apps
        port = int(sys.argv[sys.argv.index("--http") + 1]) if len(sys.argv) > sys.argv.index("--http") + 1 else 9000
        print(f"Starting RAGStudio MCP Server on HTTP port {port}...")
        mcp.run(transport="http", host="127.0.0.1", port=port)
    else:
        # Run as stdio server for local tools (Claude Desktop, etc.)
        print("Starting RAGStudio MCP Server (stdio transport)...")
        mcp.run()
```

---

## 9. Vector Database Backends {#9-vector-databases}

### ChromaDB Integration

Your existing `vectorstore.py` already supports ChromaDB. The MCP server wraps it:

```python
# How your existing ChromaDB code maps to MCP tools:
#
# Your vectorstore.py:
#   ChromaDBStore.search(query_embedding, top_k)  →  MCP tool: vector_search
#   ChromaDBStore.add(ids, vectors, metadata)     →  MCP tool: store_document
#   ChromaDBStore.delete(id)                      →  MCP tool: delete_document
#   ChromaDBStore.stats()                         →  MCP tool: get_collection_stats
```

### Qdrant Integration

To add Qdrant support (as an alternative to ChromaDB):

```python
# In your vectorstore.py, add:
class QdrantStore:
    def __init__(self, collection_name, dimensions=384):
        from qdrant_client import QdrantClient
        self.client = QdrantClient(":memory:")  # or host/port
        self.collection = collection_name
        # Create collection with dimensions...
    
    def search(self, query_embedding, top_k=5):
        results = self.client.search(
            collection_name=self.collection,
            query_vector=query_embedding,
            limit=top_k
        )
        return [{"id": r.id, "score": r.score, "text": r.payload.get("text", "")} for r in results]
```

### Pinecone Integration

```python
# In your vectorstore.py, add:
class PineconeStore:
    def __init__(self, index_name, dimensions=384):
        from pinecone import Pinecone
        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        self.index = pc.Index(index_name)
    
    def search(self, query_embedding, top_k=5):
        results = self.index.query(vector=query_embedding, top_k=top_k, include_metadata=True)
        return [{"id": m.id, "score": m.score, "text": m.metadata.get("text", "")} for m in results.matches]
```

---

## 10. Testing & Deployment {#10-testing-deployment}

### Testing with MCP Inspector

```bash
# Install the MCP Inspector
npx -y @modelcontextprotocol/inspector -- python backend/mcp_server.py

# This opens a web UI where you can:
# - See all available tools
# - Test each tool with custom inputs
# - View resource contents
# - Test prompt templates
```

### Testing with Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ragstudio": {
      "command": "python",
      "args": ["backend/mcp_server.py"],
      "cwd": "/path/to/RagStudio"
    }
  }
}
```

### Testing via HTTP

```bash
# Start the server in HTTP mode
python backend/mcp_server.py --http 9000

# Test with curl
curl -X POST http://localhost:9000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

### Integration with Your React Frontend

Your existing `api.ts` can be extended to call the MCP server:

```typescript
// Add to src/services/api.ts
export const mcpAPI = {
  search: (query: string, collection?: string) =>
    apiFetch('/mcp/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        name: 'vector_search',
        arguments: { query, collection: collection || 'default' }
      })
    }),
  
  storeDocument: (text: string, collection?: string) =>
    apiFetch('/mcp/tools/call', {
      method: 'POST',
      body: JSON.stringify({
        name: 'store_document',
        arguments: { text, collection: collection || 'default' }
      })
    }),
  
  listCollections: () =>
    apiFetch('/mcp/tools/call', {
      method: 'POST',
      body: JSON.stringify({ name: 'list_collections', arguments: {} })
    }),
};
```

---

## Summary: Key Takeaways

### What MCP Gives Your RAG App

| Benefit | Before MCP | After MCP |
|---------|-----------|-----------|
| **Backend Flexibility** | Hardcoded to one DB | Swap ChromaDB ↔ Qdrant ↔ Pinecone |
| **Tool Discovery** | Fixed API endpoints | LLM discovers tools at runtime |
| **Reusability** | App-specific code | Any MCP-compatible AI app |
| **Multi-Source** | One data source | Multiple MCP servers combined |
| **Standardization** | Custom protocols | Industry-standard JSON-RPC |
| **Testing** | Custom test harness | MCP Inspector tool |

### Architecture Pattern

```
Your Existing App                    MCP RAG Server
┌──────────────┐                    ┌──────────────────┐
│  React UI    │                    │  MCP Tools:      │
│  ↓           │                    │  - vector_search │
│  api.ts      │ ←── HTTP/stdio ──→ │  - store_document│
│  ↓           │                    │  - generate_answer│
│  FastAPI     │                    │  MCP Resources:  │
│  backend     │                    │  - collections   │
└──────────────┘                    │  MCP Prompts:    │
                                    │  - rag_qa        │
                                    └────────┬─────────┘
                                             │
                                    ┌────────▼─────────┐
                                    │ Vector Database  │
                                    │ ChromaDB/Qdrant/ │
                                    │ Pinecone/FAISS   │
                                    └──────────────────┘
```

---

*This document was created for RAGStudio. For more information on MCP, visit [modelcontextprotocol.io](https://modelcontextprotocol.io).*
