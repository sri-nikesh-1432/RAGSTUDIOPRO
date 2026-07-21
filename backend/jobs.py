"""
RAG Studio Pro - Job Tracking System
Tracks async upload processing jobs with progress stages.
Jobs are stored in memory and cleaned up after 30 minutes.
"""

import uuid
import time
import threading
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

# ─── Job Stages ────────────────────────────────────────────────────

STAGES = {
    "uploading": {"order": 0, "label": "Uploading...", "percent": 5},
    "saving": {"order": 1, "label": "Saving to disk...", "percent": 15},
    "parsing": {"order": 2, "label": "Parsing content...", "percent": 30},
    "extracting_metadata": {"order": 3, "label": "Extracting metadata...", "percent": 40},
    "extracting_frames": {"order": 4, "label": "Extracting frames...", "percent": 45},
    "extracting_audio": {"order": 5, "label": "Extracting audio...", "percent": 50},
    "running_ocr": {"order": 6, "label": "Running OCR...", "percent": 60},
    "transcribing": {"order": 7, "label": "Transcribing speech...", "percent": 65},
    "generating_embeddings": {"order": 8, "label": "Generating embeddings...", "percent": 80},
    "saving_results": {"order": 9, "label": "Saving results...", "percent": 90},
    "completed": {"order": 10, "label": "Completed", "percent": 100},
}

# ─── Job Data ──────────────────────────────────────────────────────

class Job:
    """Represents a single async upload processing job."""

    def __init__(self, file_name: str, file_size: int, category: str):
        self.job_id = f"job_{uuid.uuid4().hex[:8]}"
        self.file_name = file_name
        self.file_size = file_size
        self.category = category  # 'text', 'audio', 'video'
        self.status = "pending"  # pending, running, completed, failed
        self.stage = "uploading"
        self.progress = 0.0
        self.error: Optional[str] = None
        self.result: Optional[Dict[str, Any]] = None
        self.tmp_path: Optional[str] = None
        self.created_at = datetime.now().isoformat()
        self.updated_at = self.created_at
        self.completed_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Serialize job to dict for API response."""
        stage_info = STAGES.get(self.stage, {"order": 99, "label": self.stage, "percent": 0})
        return {
            "job_id": self.job_id,
            "file_name": self.file_name,
            "file_size": self.file_size,
            "category": self.category,
            "status": self.status,
            "stage": self.stage,
            "stage_label": stage_info["label"],
            "progress": round(self.progress, 1),
            "error": self.error,
            "result": self.result,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "completed_at": self.completed_at,
        }

    def set_stage(self, stage: str):
        """Update job to a new processing stage."""
        stage_info = STAGES.get(stage, {"order": 99, "label": stage, "percent": 0})
        self.stage = stage
        self.progress = stage_info["percent"]
        self.updated_at = datetime.now().isoformat()

    def set_progress(self, percent: float):
        """Set a custom progress percentage."""
        self.progress = min(max(percent, 0), 100)
        self.updated_at = datetime.now().isoformat()

    def mark_completed(self, result: Dict[str, Any]):
        """Mark job as completed successfully."""
        self.status = "completed"
        self.stage = "completed"
        self.progress = 100.0
        self.result = result
        self.completed_at = datetime.now().isoformat()
        self.updated_at = self.completed_at

    def mark_failed(self, error: str):
        """Mark job as failed with error message."""
        self.status = "failed"
        self.error = error
        self.completed_at = datetime.now().isoformat()
        self.updated_at = self.completed_at


# ─── Job Manager ───────────────────────────────────────────────────

class JobManager:
    """Manages async upload processing jobs with auto-cleanup."""

    def __init__(self, cleanup_minutes: int = 30):
        self._jobs: Dict[str, Job] = {}
        self._cleanup_minutes = cleanup_minutes
        self._lock = threading.Lock()

    def create_job(self, file_name: str, file_size: int, category: str) -> Job:
        """Create a new processing job."""
        job = Job(file_name, file_size, category)
        job.status = "running"
        with self._lock:
            self._jobs[job.job_id] = job
        return job

    def get_job(self, job_id: str) -> Optional[Job]:
        """Get a job by ID."""
        with self._lock:
            job = self._jobs.get(job_id)
            if job:
                return job
        return None

    def update_stage(self, job_id: str, stage: str):
        """Update a job's processing stage."""
        job = self.get_job(job_id)
        if job:
            job.set_stage(stage)

    def update_progress(self, job_id: str, percent: float):
        """Update a job's progress percentage."""
        job = self.get_job(job_id)
        if job:
            job.set_progress(percent)

    def complete_job(self, job_id: str, result: Dict[str, Any]):
        """Mark a job as completed."""
        job = self.get_job(job_id)
        if job:
            job.mark_completed(result)

    def fail_job(self, job_id: str, error: str):
        """Mark a job as failed."""
        job = self.get_job(job_id)
        if job:
            job.mark_failed(error)

    def cleanup_old_jobs(self):
        """Remove jobs older than cleanup_minutes."""
        cutoff = datetime.now() - timedelta(minutes=self._cleanup_minutes)
        with self._lock:
            expired = [
                jid for jid, job in self._jobs.items()
                if job.completed_at and datetime.fromisoformat(job.completed_at) < cutoff
            ]
            for jid in expired:
                # Also clean up temp files
                job = self._jobs[jid]
                if job.tmp_path:
                    try:
                        import os
                        if os.path.exists(job.tmp_path):
                            os.unlink(job.tmp_path)
                    except Exception:
                        pass
                del self._jobs[jid]

    def list_jobs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent jobs."""
        with self._lock:
            sorted_jobs = sorted(
                self._jobs.values(),
                key=lambda j: j.created_at,
                reverse=True,
            )[:limit]
            return [j.to_dict() for j in sorted_jobs]


# ─── Singleton ─────────────────────────────────────────────────────

job_manager = JobManager()
