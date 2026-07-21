"""
Start the RAG Studio Pro backend server.
Automatically loads .env file from the backend directory.
"""
import subprocess
import sys
import os

# ─── Load .env file automatically ──────────────────────────
def load_env():
    """Load environment variables from .env file in the backend directory."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
            print(f"[ENV] Loaded configuration from backend/.env")
            return True
        except ImportError:
            print("[WARN] python-dotenv not installed. Run: pip install python-dotenv")
            print("   Or manually set environment variables in your terminal.")
    else:
        print("[ENV] No .env file found. Using system environment variables.")
        print("   To configure: copy backend/.env.example to backend/.env and edit it.")
    return False

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

    # Load .env file first
    load_env()
    print()

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
