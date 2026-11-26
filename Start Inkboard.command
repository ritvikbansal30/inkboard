#!/bin/zsh
# Double-click to start Inkboard, then it opens in your browser.
cd "$(dirname "$0")"
PORT=8777
if ! lsof -i :$PORT >/dev/null 2>&1; then
  nohup python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 0.8
fi
open "http://127.0.0.1:$PORT/index.html"
