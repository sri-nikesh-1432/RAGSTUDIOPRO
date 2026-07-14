# RAG Studio Pro

> **Understand. Build. Visualize. Optimize.**

RAG Studio Pro is an interactive platform for learning and building Retrieval-Augmented Generation systems. It takes you from zero knowledge of RAG all the way to building production-ready pipelines — all in one place, right in your browser or as a desktop app.

---

## What is this?

If you've ever wondered how ChatGPT retrieves relevant documents before answering your questions, or how companies build AI systems that actually know about their own data — this is the tool that lets you explore, understand, and build those systems yourself.

RAG (Retrieval-Augmented Generation) is the technique behind most modern AI applications that need to access real, up-to-date information. Instead of relying solely on what a language model learned during training, RAG fetches relevant documents and uses them as context to generate accurate, grounded answers.

**RAG Studio Pro** makes every invisible stage of this process visible and interactive.

---

## What can you do with it?

### Learn RAG from scratch
- **30+ topics** covering AI foundations, language models, embeddings, vector databases, and advanced RAG techniques
- **10 real-world analogies** — understand RAG through cricket matches, hospitals, Netflix recommendations, Google Maps, and more
- **Interactive simulators** for chunking, embedding visualization, cosine similarity, and token counting

### Build real RAG pipelines
- Upload any file type — PDFs, Word documents, spreadsheets, presentations, CSVs, HTML, JSON, images, and more
- Choose from 7 chunking strategies and see how each one affects your chunks
- Select from 5 embedding models (MiniLM, BGE, E5, MPNet, Instructor) and compare their outputs
- Store vectors in FAISS or ChromaDB and run semantic search queries
- Connect to Ollama for local LLM inference or OpenAI for cloud-based generation

### Experiment freely
- **Playground** — test prompt engineering, visualize tokenization, explore context windows
- **Model Manager** — download, switch, and benchmark LLM and embedding models
- **Analytics** — track precision, recall, F1 scores, latency, and system resources in real-time

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| State Management | Zustand |
| Animations | Framer Motion |
| Charts | Recharts, Plotly |
| Backend | FastAPI, Python |
| File Parsing | PyMuPDF, python-docx, openpyxl, python-pptx, BeautifulSoup |
| Embeddings | sentence-transformers (MiniLM, BGE, E5, MPNet, Instructor) |
| Vector Stores | FAISS, ChromaDB |
| LLM Integration | Ollama (local), OpenAI (cloud) |

---

## Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- **Ollama** (optional, for local LLM inference)

### Installation

```bash
# Clone the repository
git clone https://github.com/sri-nikesh-1432/RAGSTUDIOPRO.git
cd RAGSTUDIOPRO

# Install frontend dependencies
npm install

# Install Python backend dependencies
pip install -r requirements.txt
```

### Running locally

```bash
# Start the frontend (Vite dev server)
npm run dev

# In a separate terminal, start the backend
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The app opens at `http://localhost:5173`.

---

## How the RAG Pipeline Works

```
┌─────────────┐     ┌───────────┐     ┌───────────┐     ┌──────────────┐
│  Upload a    │────▶│  Chunk    │────▶│  Embed    │────▶│  Store in    │
│  Document    │     │  Text     │     │  Chunks   │     │  Vector DB   │
└─────────────┘     └───────────┘     └───────────┘     └──────────────┘
                                                                │
                                                                ▼
┌─────────────┐     ┌───────────┐     ┌──────────────────────────────┐
│  Generated  │◀────│  LLM      │◀────│  Retrieve Relevant Chunks    │
│  Answer     │     │  Generate  │     │  (Semantic Search)           │
└─────────────┘     └───────────┘     └──────────────────────────────┘
```

1. **Ingest** — Upload any file and the backend parses it into plain text
2. **Chunk** — Split the text into smaller pieces using one of 7 strategies
3. **Embed** — Convert each chunk into a numerical vector that captures its meaning
4. **Store** — Save the vectors in a database for fast similarity search
5. **Retrieve** — When you ask a question, find the most relevant chunks
6. **Generate** — Feed the retrieved context to an LLM to produce an accurate answer

---

## Project Structure

```
RAGSTUDIOPRO/
├── backend/                # FastAPI Python backend
│   ├── main.py             # API server with all endpoints
│   ├── models.py           # Pydantic data models
│   ├── parsers.py          # File parsing (PDF, DOCX, XLSX, etc.)
│   ├── chunkers.py         # 7 chunking strategies
│   ├── embeddings.py       # Sentence transformer embeddings
│   ├── vectorstore.py      # FAISS + ChromaDB integration
│   ├── retrieval.py        # Search and reranking
│   ├── llm.py              # Ollama + OpenAI generation
│   ├── pipeline.py         # Visual pipeline debugger
│   └── projects.py         # Project save/load/export
├── src/                    # React frontend
│   ├── components/         # Shared UI components
│   ├── pages/              # Page components
│   ├── services/           # API service layer
│   ├── store/              # Zustand state management
│   └── lib/                # Utilities
├── electron/               # Electron desktop app
├── public/                 # Static assets
├── package.json            # Frontend config
├── requirements.txt        # Python dependencies
└── electron-builder.yml    # Desktop build config
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RAG_CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins |
| `RAG_MAX_UPLOAD_SIZE` | `104857600` (100MB) | Max file upload size in bytes |
| `OPENAI_API_KEY` | — | OpenAI API key for cloud LLM |
| `RAG_CHROMADB_PATH` | `./data/chromadb` | ChromaDB storage path |
| `RAG_LLM_TIMEOUT` | `120` | LLM request timeout in seconds |

---

## License

MIT License
