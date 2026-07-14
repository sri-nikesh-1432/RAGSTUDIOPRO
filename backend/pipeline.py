"""
RAG Studio Pro - Visual Pipeline Debugger
Tracks every step of the RAG pipeline with live data inspection.
"""

import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict


@dataclass
class PipelineStepData:
    step_id: str
    name: str
    status: str = "pending"
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: float = 0
    input_preview: str = ""
    output_preview: str = ""
    input_count: int = 0
    output_count: int = 0
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PipelineRunData:
    run_id: str
    steps: List[PipelineStepData] = field(default_factory=list)
    status: str = "running"
    started_at: str = ""
    completed_at: Optional[str] = None
    total_duration_ms: float = 0
    analytics: Dict[str, Any] = field(default_factory=dict)


# ─── Step Definitions ──────────────────────────────────────────────

PIPELINE_STEP_DEFINITIONS = [
    {"step_id": "parse", "name": "📄 File Parsing", "description": "Extract text from document"},
    {"step_id": "chunk", "name": "✂️ Chunking", "description": "Split text into chunks"},
    {"step_id": "embed", "name": "🧠 Embedding", "description": "Generate vector embeddings"},
    {"step_id": "store", "name": "🗄️ Vector Store", "description": "Store vectors in index"},
    {"step_id": "retrieve", "name": "🔍 Retrieval", "description": "Search for relevant chunks"},
    {"step_id": "prompt", "name": "📝 Prompt Building", "description": "Build LLM prompt with context"},
    {"step_id": "generate", "name": "🤖 Generation", "description": "Generate answer with LLM"},
]


# ─── Pipeline Tracker ──────────────────────────────────────────────

class PipelineTracker:
    """Tracks the execution of a RAG pipeline run."""

    def __init__(self):
        self.runs: Dict[str, PipelineRunData] = {}

    def create_run(self) -> str:
        """Create a new pipeline run."""
        run_id = str(uuid.uuid4())[:8]
        run = PipelineRunData(
            run_id=run_id,
            started_at=datetime.now().isoformat(),
            steps=[
                PipelineStepData(step_id=s["step_id"], name=s["name"])
                for s in PIPELINE_STEP_DEFINITIONS
            ],
        )
        self.runs[run_id] = run
        return run_id

    def start_step(self, run_id: str, step_id: str, input_preview: str = "", input_count: int = 0):
        """Mark a step as started."""
        run = self.runs.get(run_id)
        if not run:
            return

        for step in run.steps:
            if step.step_id == step_id:
                step.status = "running"
                step.started_at = datetime.now().isoformat()
                step.input_preview = input_preview[:500]
                step.input_count = input_count
                break

    def complete_step(
        self, run_id: str, step_id: str,
        output_preview: str = "", output_count: int = 0,
        metadata: Dict = None
    ):
        """Mark a step as completed."""
        run = self.runs.get(run_id)
        if not run:
            return

        for step in run.steps:
            if step.step_id == step_id:
                step.status = "completed"
                step.completed_at = datetime.now().isoformat()
                step.output_preview = output_preview[:500]
                step.output_count = output_count
                if metadata:
                    step.metadata = metadata

                # Calculate duration
                if step.started_at:
                    start = datetime.fromisoformat(step.started_at)
                    end = datetime.fromisoformat(step.completed_at)
                    step.duration_ms = (end - start).total_seconds() * 1000
                break

    def fail_step(self, run_id: str, step_id: str, error: str):
        """Mark a step as failed."""
        run = self.runs.get(run_id)
        if not run:
            return

        for step in run.steps:
            if step.step_id == step_id:
                step.status = "failed"
                step.completed_at = datetime.now().isoformat()
                step.error = error
                break

    def complete_run(self, run_id: str, analytics: Dict = None):
        """Mark the entire run as completed."""
        run = self.runs.get(run_id)
        if not run:
            return

        run.status = "completed"
        run.completed_at = datetime.now().isoformat()

        if run.started_at:
            start = datetime.fromisoformat(run.started_at)
            end = datetime.fromisoformat(run.completed_at)
            run.total_duration_ms = (end - start).total_seconds() * 1000

        if analytics:
            run.analytics = analytics

    def get_run(self, run_id: str) -> Optional[Dict]:
        """Get a pipeline run with all step data."""
        run = self.runs.get(run_id)
        if not run:
            return None

        return {
            "run_id": run.run_id,
            "status": run.status,
            "started_at": run.started_at,
            "completed_at": run.completed_at,
            "total_duration_ms": run.total_duration_ms,
            "steps": [
                {
                    "step_id": s.step_id,
                    "name": s.name,
                    "status": s.status,
                    "started_at": s.started_at,
                    "completed_at": s.completed_at,
                    "duration_ms": s.duration_ms,
                    "input_preview": s.input_preview,
                    "output_preview": s.output_preview,
                    "input_count": s.input_count,
                    "output_count": s.output_count,
                    "error": s.error,
                    "metadata": s.metadata,
                }
                for s in run.steps
            ],
            "analytics": run.analytics,
        }

    def get_step_data(self, run_id: str, step_id: str) -> Optional[Dict]:
        """Get detailed data for a specific step."""
        run = self.runs.get(run_id)
        if not run:
            return None

        for step in run.steps:
            if step.step_id == step_id:
                return {
                    "step_id": step.step_id,
                    "name": step.name,
                    "status": step.status,
                    "input_preview": step.input_preview,
                    "output_preview": step.output_preview,
                    "input_count": step.input_count,
                    "output_count": step.output_count,
                    "metadata": step.metadata,
                    "duration_ms": step.duration_ms,
                    "error": step.error,
                }
        return None

    def list_runs(self) -> List[Dict]:
        """List all pipeline runs."""
        return [
            {
                "run_id": run.run_id,
                "status": run.status,
                "started_at": run.started_at,
                "total_duration_ms": run.total_duration_ms,
                "step_count": len(run.steps),
                "completed_steps": sum(1 for s in run.steps if s.status == "completed"),
            }
            for run in sorted(self.runs.values(), key=lambda r: r.started_at, reverse=True)
        ]


# ─── Memory & System Monitor ──────────────────────────────────────

def get_system_analytics() -> Dict[str, Any]:
    """Get current system analytics."""
    import os
    import platform

    analytics = {
        "platform": platform.system(),
        "python_version": platform.python_version(),
        "cpu_count": os.cpu_count(),
    }

    # Memory
    try:
        import psutil
        mem = psutil.virtual_memory()
        analytics["memory_total_mb"] = round(mem.total / 1_000_000, 1)
        analytics["memory_used_mb"] = round(mem.used / 1_000_000, 1)
        analytics["memory_percent"] = mem.percent
    except ImportError:
        pass

    # GPU
    try:
        import torch
        if torch.cuda.is_available():
            analytics["cuda_available"] = True
            analytics["gpu_name"] = torch.cuda.get_device_name(0)
            analytics["gpu_memory_mb"] = round(torch.cuda.get_device_properties(0).total_mem / 1_000_000, 1)
        else:
            analytics["cuda_available"] = False
    except (ImportError, Exception):
        analytics["cuda_available"] = False

    # PyTorch
    try:
        import torch
        analytics["torch_version"] = torch.__version__
    except ImportError:
        analytics["torch_version"] = None

    return analytics
