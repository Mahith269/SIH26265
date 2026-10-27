# FDR Management Portal

A React-based frontend for an FDR (Fixed Deposit Receipt) management portal. The interface communicates with a FastAPI backend to list and register FDR records, display maturity alerts, and submit or review records.

## Project structure

- `frontend/` — React application built with Vite.
- `package.json` and `package-lock.json` — root-level JavaScript dependency manifests from the supplied project.

## Frontend setup

Requirements: Node.js and npm.

```bash
cd frontend
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

## Backend note

The frontend sends requests to `http://127.0.0.1:8000` and expects a FastAPI backend with FDR endpoints. Backend application source files were not present outside the bundled virtual environment in the supplied ZIP, so they are not included here. The frontend's data features require that backend to be available.

## Notes

Dependency directories, virtual environments, Python caches, and local database files are intentionally excluded. Dependency versions in the supplied manifests have not been upgraded.
