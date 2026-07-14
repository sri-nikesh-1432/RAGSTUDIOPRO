"""
RAG Studio Pro - LLM Module
Support for both Ollama (local) and OpenAI (API) for text generation.
"""

import time
import json
import os
import httpx
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


# ─── Ollama Client ────────────────────────────────────────────────

class OllamaClient:
    """Client for Ollama local LLM server."""

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url.rstrip("/")

    def is_available(self) -> bool:
        """Check if Ollama server is running."""
        try:
            resp = httpx.get(f"{self.base_url}/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False

    def list_models(self) -> List[Dict]:
        """List all available Ollama models."""
        try:
            resp = httpx.get(f"{self.base_url}/api/tags", timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                return [
                    {
                        "name": m.get("name", ""),
                        "size": m.get("size", 0),
                        "modified": m.get("modified_at", ""),
                    }
                    for m in data.get("models", [])
                ]
        except Exception:
            pass
        return []

    def generate(
        self,
        prompt: str,
        model: str = "llama3.2",
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """Generate text using Ollama."""
        start_time = time.time()

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            llm_timeout = float(os.environ.get("RAG_LLM_TIMEOUT", 120))
            resp = httpx.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,
                    },
                },
                timeout=llm_timeout,
            )

            elapsed = (time.time() - start_time) * 1000

            if resp.status_code == 200:
                data = resp.json()
                content = data.get("message", {}).get("content", "")
                eval_count = data.get("eval_count", 0)
                eval_duration = data.get("eval_duration", 0) / 1_000_000  # ns to ms

                return {
                    "success": True,
                    "answer": content,
                    "model": model,
                    "provider": "ollama",
                    "prompt_tokens": data.get("prompt_eval_count", 0),
                    "completion_tokens": eval_count,
                    "total_tokens": data.get("prompt_eval_count", 0) + eval_count,
                    "generation_time_ms": eval_duration,
                    "total_time_ms": elapsed,
                    "full_prompt": prompt[:500] + "..." if len(prompt) > 500 else prompt,
                }
            else:
                return {
                    "success": False,
                    "error": f"Ollama returned status {resp.status_code}: {resp.text}",
                    "total_time_ms": elapsed,
                }

        except httpx.ConnectError:
            return {
                "success": False,
                "error": "Cannot connect to Ollama. Is it running? Start with: ollama serve",
                "total_time_ms": (time.time() - start_time) * 1000,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "total_time_ms": (time.time() - start_time) * 1000,
            }


# ─── OpenAI Client ────────────────────────────────────────────────

class OpenAIClient:
    """Client for OpenAI API."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key

    def generate(
        self,
        prompt: str,
        model: str = "gpt-3.5-turbo",
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        api_key: str = None,
    ) -> Dict[str, Any]:
        """Generate text using OpenAI API."""
        start_time = time.time()
        key = api_key or self.api_key

        if not key:
            return {
                "success": False,
                "error": "No OpenAI API key provided",
                "total_time_ms": 0,
            }

        try:
            from openai import OpenAI
            client = OpenAI(api_key=key)

            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            elapsed = (time.time() - start_time) * 1000
            choice = response.choices[0]
            usage = response.usage

            return {
                "success": True,
                "answer": choice.message.content or "",
                "model": model,
                "provider": "openai",
                "prompt_tokens": usage.prompt_tokens if usage else 0,
                "completion_tokens": usage.completion_tokens if usage else 0,
                "total_tokens": usage.total_tokens if usage else 0,
                "generation_time_ms": elapsed,
                "total_time_ms": elapsed,
                "full_prompt": prompt[:500] + "..." if len(prompt) > 500 else prompt,
            }

        except ImportError:
            return {
                "success": False,
                "error": "openai package not installed. Run: pip install openai",
                "total_time_ms": (time.time() - start_time) * 1000,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "total_time_ms": (time.time() - start_time) * 1000,
            }


# ─── Prompt Builder ────────────────────────────────────────────────

DEFAULT_SYSTEM_PROMPT = """You are a helpful AI assistant. Answer the user's question based on the provided context. 
If the context doesn't contain enough information, say so clearly. 
Be concise and accurate. Cite specific parts of the context when possible."""


def build_rag_prompt(
    query: str,
    context_chunks: List[str],
    system_prompt: str = None,
) -> str:
    """Build a RAG prompt with query and context."""
    context_text = "\n\n---\n\n".join(context_chunks) if context_chunks else "No context available."

    prompt = f"""Context:
{context_text}

Question: {query}

Answer based on the context above:"""

    return prompt


def get_system_prompt(custom: str = None) -> str:
    """Get the system prompt, custom or default."""
    return custom or DEFAULT_SYSTEM_PROMPT


# ─── Free Cloud Client (Groq, Hugging Face, OpenRouter) ──────────

class FreeCloudClient:
    """Client for free OpenAI-compatible APIs (Groq, Hugging Face, OpenRouter)."""

    PROVIDERS = {
        "groq": {
            "base_url": "https://api.groq.com/openai/v1",
            "models": [
                {"id": "llama-3.1-8b-instant", "name": "Llama 3.1 8B", "speed": "Very Fast"},
                {"id": "llama-3.3-70b-versatile", "name": "Llama 3.3 70B", "speed": "Fast"},
                {"id": "mixtral-8x7b-32768", "name": "Mixtral 8x7B", "speed": "Fast"},
                {"id": "gemma2-9b-it", "name": "Gemma 2 9B", "speed": "Fast"},
            ],
            "env_key": "GROQ_API_KEY",
            "signup_url": "https://console.groq.com/keys",
        },
        "huggingface": {
            "base_url": "https://router.huggingface.co/v1",
            "models": [
                {"id": "meta-llama/Llama-3.1-8B-Instruct", "name": "Llama 3.1 8B", "speed": "Medium"},
                {"id": "mistralai/Mistral-7B-Instruct-v0.3", "name": "Mistral 7B", "speed": "Medium"},
                {"id": "HuggingFaceH4/zephyr-7b-beta", "name": "Zephyr 7B", "speed": "Medium"},
                {"id": "microsoft/Phi-3-mini-4k-instruct", "name": "Phi-3 Mini", "speed": "Fast"},
            ],
            "env_key": "HF_API_KEY",
            "signup_url": "https://huggingface.co/settings/tokens",
        },
        "openrouter": {
            "base_url": "https://openrouter.ai/api/v1",
            "models": [
                {"id": "meta-llama/llama-3.1-8b-instruct:free", "name": "Llama 3.1 8B (Free)", "speed": "Fast"},
                {"id": "mistralai/mistral-7b-instruct:free", "name": "Mistral 7B (Free)", "speed": "Fast"},
                {"id": "google/gemma-2-9b-it:free", "name": "Gemma 2 9B (Free)", "speed": "Fast"},
                {"id": "openrouter/free", "name": "Auto (Best Free)", "speed": "Varies"},
            ],
            "env_key": "OPENROUTER_API_KEY",
            "signup_url": "https://openrouter.ai/keys",
        },
    }

    def generate(
        self,
        prompt: str,
        model: str = "llama-3.1-8b-instant",
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        api_key: str = None,
        provider: str = "groq",
    ) -> Dict[str, Any]:
        """Generate text using a free cloud provider."""
        start_time = time.time()
        provider_config = self.PROVIDERS.get(provider, self.PROVIDERS["groq"])
        key = api_key or os.environ.get(provider_config["env_key"], "")

        if not key:
            return {
                "success": False,
                "error": f"No API key provided for {provider}. Get a free key at {provider_config['signup_url']}",
                "total_time_ms": 0,
            }

        try:
            import openai
            client = openai.OpenAI(base_url=provider_config["base_url"], api_key=key)

            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            elapsed = (time.time() - start_time) * 1000
            choice = response.choices[0]
            usage = response.usage

            return {
                "success": True,
                "answer": choice.message.content or "",
                "model": model,
                "provider": provider,
                "prompt_tokens": usage.prompt_tokens if usage else 0,
                "completion_tokens": usage.completion_tokens if usage else 0,
                "total_tokens": usage.total_tokens if usage else 0,
                "generation_time_ms": elapsed,
                "total_time_ms": elapsed,
            }

        except ImportError:
            return {
                "success": False,
                "error": "openai package not installed. Run: pip install openai",
                "total_time_ms": (time.time() - start_time) * 1000,
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "total_time_ms": (time.time() - start_time) * 1000,
            }

    def get_provider_info(self) -> Dict[str, Any]:
        """Get info about all free cloud providers."""
        result = {}
        for name, config in self.PROVIDERS.items():
            has_key = bool(os.environ.get(config["env_key"], ""))
            result[name] = {
                "name": name.replace("huggingface", "Hugging Face").replace("openrouter", "Open Router").title(),
                "models": config["models"],
                "has_key": has_key,
                "signup_url": config["signup_url"],
            }
        return result


# ─── Unified Generator ────────────────────────────────────────────

class LLMGenerator:
    """Unified interface for all LLM providers."""

    def __init__(self):
        self.ollama = OllamaClient()
        self.openai = OpenAIClient()
        self.free_cloud = FreeCloudClient()

    def generate(
        self,
        query: str,
        context: List[str] = None,
        provider: str = "ollama",
        model: str = "llama3.2",
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        api_key: str = None,
    ) -> Dict[str, Any]:
        """Generate a response using the specified provider."""
        prompt = build_rag_prompt(query, context or [])
        sys_prompt = get_system_prompt(system_prompt)

        if provider == "openai":
            return self.openai.generate(
                prompt=prompt, model=model, system_prompt=sys_prompt,
                temperature=temperature, max_tokens=max_tokens, api_key=api_key,
            )
        elif provider in ("groq", "huggingface", "openrouter"):
            return self.free_cloud.generate(
                prompt=prompt, model=model, system_prompt=sys_prompt,
                temperature=temperature, max_tokens=max_tokens,
                api_key=api_key, provider=provider,
            )
        else:
            return self.ollama.generate(
                prompt=prompt, model=model, system_prompt=sys_prompt,
                temperature=temperature, max_tokens=max_tokens,
            )

    def check_ollama(self) -> Dict[str, Any]:
        """Check Ollama status and list models."""
        available = self.ollama.is_available()
        models = self.ollama.list_models() if available else []
        return {
            "available": available,
            "url": self.ollama.base_url,
            "models": models,
        }

    def get_free_providers(self) -> Dict[str, Any]:
        """Get info about free cloud providers."""
        return self.free_cloud.get_provider_info()
