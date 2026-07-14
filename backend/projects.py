"""
RAG Studio Pro - Project System
Save, load, export, and manage RAG projects like VS Code.
"""

import os
import json
import shutil
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path


# ─── Project Paths ─────────────────────────────────────────────────

def get_projects_root() -> str:
    """Get the root directory for all projects."""
    root = os.path.join(os.path.expanduser("~"), ".rag-studio-pro", "projects")
    os.makedirs(root, exist_ok=True)
    return root


def get_project_dir(name: str) -> str:
    """Get the directory for a specific project."""
    safe_name = name.replace("/", "_").replace("\\", "_").replace(" ", "_")
    return os.path.join(get_projects_root(), safe_name)


def get_project_structure(project_dir: str) -> Dict[str, Any]:
    """Get the folder structure of a project."""
    structure = {
        "name": os.path.basename(project_dir),
        "path": project_dir,
        "type": "directory",
        "children": [],
    }

    if not os.path.exists(project_dir):
        return structure

    for item in sorted(os.listdir(project_dir)):
        item_path = os.path.join(project_dir, item)
        if os.path.isdir(item_path):
            structure["children"].append({
                "name": item,
                "path": item_path,
                "type": "directory",
                "children": [],
            })
        else:
            stat = os.stat(item_path)
            structure["children"].append({
                "name": item,
                "path": item_path,
                "type": "file",
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })

    return structure


# ─── Project Operations ────────────────────────────────────────────

def create_project(name: str, description: str = "") -> Dict[str, Any]:
    """Create a new project with folder structure."""
    project_dir = get_project_dir(name)

    if os.path.exists(project_dir):
        return {"success": False, "error": f"Project '{name}' already exists"}

    # Create folder structure
    folders = ["documents", "embeddings", "vectordb", "reports", "models", "settings"]
    for folder in folders:
        os.makedirs(os.path.join(project_dir, folder), exist_ok=True)

    # Create project config
    config = {
        "name": name,
        "description": description,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "chunking_method": "recursive",
        "chunk_size": 500,
        "overlap": 50,
        "embedding_model": "all-MiniLM-L6-v2",
        "vector_store": "faiss_flat",
        "collection_name": name.lower().replace(" ", "_"),
        "llm_provider": "ollama",
        "llm_model": "llama3.2",
        "files": [],
    }

    with open(os.path.join(project_dir, "settings", "config.json"), "w") as f:
        json.dump(config, f, indent=2)

    return {"success": True, "project": config, "path": project_dir}


def save_project(name: str, config: Dict = None, files_data: Dict = None) -> Dict[str, Any]:
    """Save project configuration and data."""
    project_dir = get_project_dir(name)

    if not os.path.exists(project_dir):
        result = create_project(name)
        if not result["success"]:
            return result

    # Save config
    if config:
        config_path = os.path.join(project_dir, "settings", "config.json")
        config["updated_at"] = datetime.now().isoformat()
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)

    # Save files data (vectors, chunks, etc.)
    if files_data:
        for key, data in files_data.items():
            file_path = os.path.join(project_dir, "vectordb", f"{key}.json")
            with open(file_path, "w") as f:
                json.dump(data, f, indent=2, default=str)

    return {"success": True, "path": project_dir}


def load_project(name: str) -> Dict[str, Any]:
    """Load project configuration and data."""
    project_dir = get_project_dir(name)

    if not os.path.exists(project_dir):
        return {"success": False, "error": f"Project '{name}' not found"}

    # Load config
    config_path = os.path.join(project_dir, "settings", "config.json")
    config = {}
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            config = json.load(f)

    # Load vector data
    vectordb_dir = os.path.join(project_dir, "vectordb")
    vectordb_data = {}
    if os.path.exists(vectordb_dir):
        for fname in os.listdir(vectordb_dir):
            if fname.endswith(".json"):
                fpath = os.path.join(vectordb_dir, fname)
                with open(fpath, "r") as f:
                    vectordb_data[fname.replace(".json", "")] = json.load(f)

    # Get folder structure
    structure = get_project_structure(project_dir)

    # Count files
    docs_dir = os.path.join(project_dir, "documents")
    file_count = len(os.listdir(docs_dir)) if os.path.exists(docs_dir) else 0

    return {
        "success": True,
        "config": config,
        "vectordb": vectordb_data,
        "structure": structure,
        "file_count": file_count,
        "path": project_dir,
    }


def delete_project(name: str) -> Dict[str, Any]:
    """Delete a project and all its data."""
    project_dir = get_project_dir(name)

    if not os.path.exists(project_dir):
        return {"success": False, "error": f"Project '{name}' not found"}

    shutil.rmtree(project_dir)
    return {"success": True, "deleted": name}


def list_projects() -> List[Dict[str, Any]]:
    """List all projects."""
    projects_root = get_projects_root()
    projects = []

    if not os.path.exists(projects_root):
        return projects

    for name in os.listdir(projects_root):
        project_dir = os.path.join(projects_root, name)
        if not os.path.isdir(project_dir):
            continue

        config_path = os.path.join(project_dir, "settings", "config.json")
        config = {}
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                config = json.load(f)

        # Count files and vectors
        docs_dir = os.path.join(project_dir, "documents")
        vectordb_dir = os.path.join(project_dir, "vectordb")

        file_count = len(os.listdir(docs_dir)) if os.path.exists(docs_dir) else 0
        vector_count = 0
        if os.path.exists(vectordb_dir):
            for fname in os.listdir(vectordb_dir):
                if fname.endswith(".json"):
                    try:
                        with open(os.path.join(vectordb_dir, fname), "r") as f:
                            data = json.load(f)
                            if isinstance(data, list):
                                vector_count += len(data)
                    except Exception:
                        pass

        projects.append({
            "name": config.get("name", name),
            "description": config.get("description", ""),
            "created_at": config.get("created_at", ""),
            "updated_at": config.get("updated_at", ""),
            "file_count": file_count,
            "vector_count": vector_count,
            "path": project_dir,
            "config": config,
        })

    return sorted(projects, key=lambda p: p.get("updated_at", ""), reverse=True)


def save_file_to_project(project_name: str, file_path: str, content: bytes = None) -> Dict[str, Any]:
    """Save a file to a project's documents directory."""
    project_dir = get_project_dir(project_name)
    docs_dir = os.path.join(project_dir, "documents")

    if not os.path.exists(project_dir):
        return {"success": False, "error": f"Project '{project_name}' not found"}

    os.makedirs(docs_dir, exist_ok=True)

    filename = os.path.basename(file_path)
    dest = os.path.join(docs_dir, filename)

    if content:
        with open(dest, "wb") as f:
            f.write(content)
    else:
        shutil.copy2(file_path, dest)

    return {"success": True, "path": dest, "filename": filename}


def export_project(project_name: str, export_path: str) -> Dict[str, Any]:
    """Export a project as a zip file."""
    project_dir = get_project_dir(project_name)

    if not os.path.exists(project_dir):
        return {"success": False, "error": f"Project '{project_name}' not found"}

    if not export_path.endswith(".zip"):
        export_path += ".zip"

    shutil.make_archive(export_path.replace(".zip", ""), "zip", project_dir)

    return {
        "success": True,
        "export_path": export_path,
        "size": os.path.getsize(export_path),
    }
