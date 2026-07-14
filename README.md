# RAG Studio Pro

**Understand. Build. Visualize. Optimize.**

RAG Studio Pro is an interactive platform for learning and building Retrieval-Augmented Generation systems. It takes you from zero knowledge of RAG all the way to building production-ready pipelines — all in one place, right in your browser.

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
- **Analytics** — track pipeline runs, measure performance, and monitor system resources in real-time

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
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

## How to Use

### 1. Start the Frontend
```bash
npm install
npm run dev
```
The app opens at `http://localhost:5173`.

### 2. Start the Backend (for full functionality)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Explore
- **Home** — Learn about RAG concepts and see real-world analogies
- **Learning Center** — Interactive simulators for chunking, embeddings, and cosine similarity
- **Builder** — Upload documents, configure your pipeline, and build a RAG system
- **Playground** — Test prompts and experiment with different configurations
- **Analytics** — Track your pipeline runs and system performance
- **Models** — Manage embedding and LLM models

---

## How the RAG Pipeline Works

1. **Ingest** — Upload any file and the backend parses it into plain text
2. **Chunk** — Split the text into smaller pieces using one of 7 strategies
3. **Embed** — Convert each chunk into a numerical vector that captures its meaning
4. **Store** — Save the vectors in a database for fast similarity search
5. **Retrieve** — When you ask a question, find the most relevant chunks
6. **Generate** — Feed the retrieved context to an LLM to produce an accurate answer

---

## License

MIT License
