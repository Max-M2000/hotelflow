#!/bin/bash
set -e

echo "Building HotelFlow Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Copying dist contents to public..."
rm -rf public/dist 2>/dev/null || true
cp -r frontend/dist/* ./

echo "Build complete!"
