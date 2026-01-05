# Fix Cloudinary Dependency Conflict

## The Problem
- `cloudinary@^2.8.0` was installed
- `multer-storage-cloudinary@4.0.0` requires `cloudinary@^1.21.0`
- Version conflict!

## The Solution

### Option 1: Clean Install (Recommended)
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

### Option 2: Force Install
```bash
cd server
npm install --legacy-peer-deps
```

## What Was Changed in package.json

```json
"cloudinary": "^1.41.0",  // Changed from ^2.8.0
"multer": "^1.4.5-lts.1",  // Changed from ^2.0.2
"multer-storage-cloudinary": "^4.0.0"  // Added
```

## After Installation

Verify socket.io is installed:
```bash
npm list socket.io
```

Should show: `socket.io@4.8.3`

## Run Your Server
```bash
npm start
```

All dependencies should now be compatible!
