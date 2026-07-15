"""
Start the RAG Studio Pro backend server.
"""
import subprocess
import sys
import os

def check_dependencies():
    """Check if required Python packages are installed."""
    required = ['fastapi', 'uvicorn']
    missing = []
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    return missing

def main():
    print("[START] RAG Studio Pro - Backend Server")
    print("=" * 40)

    missing = check_dependencies()
    if missing:
        print(f"\n[WARN] Missing packages: {', '.join(missing)}")
        print(f"   Run: pip install -r requirements.txt")
        print("\n   Continuing with available packages...\n")

    print("[INFO] Starting server on http://localhost:8000")
    print("[INFO] API docs: http://localhost:8000/docs")
    print("   Press Ctrl+C to stop\n")

    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
        )
    except KeyboardInterrupt:
        print("\n[STOP] Server stopped.")

if __name__ == "__main__":
    main()
