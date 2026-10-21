#!/bin/bash

cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required to open the complete site."
  echo "Install Node.js from https://nodejs.org/ and try again."
  read -r -p "Press Return to close this window. "
  exit 1
fi

if [ ! -x node_modules/.bin/vite ]; then
  echo "Project dependencies are not installed."
  echo "Open Terminal in this folder and run: npm ci"
  read -r -p "Press Return to close this window. "
  exit 1
fi

npm run dev -- --open
