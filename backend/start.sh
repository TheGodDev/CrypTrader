#!/bin/bash
cd "$(dirname "$0")"
exec python3 -u -m uvicorn server:app --host 127.0.0.1 --port 8000
