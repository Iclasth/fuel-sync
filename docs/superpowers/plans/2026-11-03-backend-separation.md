# Backend Separation and Standalone Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move backend code and configuration into an independent `backend/` directory, allowing independent deployment of frontend and backend without docker-compose, while keeping docker-compose as an optional alternative.

**Architecture:** Monorepo containing two decoupled, autonomous services: `backend/` (Express API) and `frontend/` (Vite + React SPA). Each service has its own `package.json`, environment definitions, test runner, and Dockerfile. The frontend's API client dynamically routes requests using `VITE_API_URL` when deployed to a separate host, or falls back to relative `/api/v1` for local proxying.

**Tech Stack:** Node.js 22, Express 5, Jest, Supertest, Vite 8, React 19, Vitest, Axios, Docker.

**Spec:** Design Doc approved in conversation (Approach A: Total isolation with optional docker-compose).

## Global Constraints

- Do not alter backend business logic, database migrations, or route contracts.
- Frontend must support standalone deployment with configurable backend URL via `VITE_API_URL`.
- Local execution must work directly using `npm run dev` in `backend/` and `frontend/` without docker-compose.
- Existing tests (32 Jest test suites in backend, 22 Vitest test suites in frontend) must remain passing.

## Review Focus

1. **Standalone Frontend Base URL:** When `VITE_API_URL` is set to `https://api.example.com`, API calls and token refreshes must target `https://api.example.com/api/v1` without double slashes or dropping endpoint paths.
2. **Local Proxy Fallback:** When `VITE_API_URL` is unset or empty, requests must use `/api/v1` so Vite proxying or same-origin setups continue working transparently.
3. **Backend Root Isolation:** Running `npm test` or `npm run dev` inside `backend/` must have no path dependencies on the parent root folder.
4. **Git Ignore Hygiene:** Secrets and build artifacts for both services (`backend/.env`, `frontend/.env`, `backend/node_modules/`, `frontend/node_modules/`) must be protected by `.gitignore`.
5. **Docker Compose Parity:** `docker-compose.yml` must build and run cleanly referencing `./backend` and `./frontend`.

---

### Task 1: Migrate Backend to Dedicated `backend/` Directory

**Files:**
- Create/Move to: `backend/`
  - `backend/src/` (from `src/`)
  - `backend/database/` (from `database/`)
  - `backend/scripts/` (from `scripts/`)
  - `backend/tests/` (from `tests/`)
  - `backend/server.js` (from `server.js`)
  - `backend/jest.config.js` (from `jest.config.js`)
  - `backend/package.json` (from `package.json`)
  - `backend/package-lock.json` (from `package-lock.json`)
  - `backend/Dockerfile` (from `Dockerfile`)
  - `backend/.dockerignore` (from `.dockerignore`)
  - `backend/.env.example` (from `.env.example`)
  - `backend/scheme.txt` (from `scheme.txt`)
  - `backend/.env` (from `.env`, if present)
- Modify: `backend/package.json`
- Modify: `backend/jest.config.js`

**Interfaces:**
- Consumes: Node.js runtime and existing dependencies.
- Produces: An autonomous `backend/` directory with `npm run dev`, `npm start`, and `npm test`.

- [ ] **Step 1: Move backend files and directories into `backend/`**
  Move `src`, `database`, `scripts`, `tests`, `server.js`, `jest.config.js`, `Dockerfile`, `.dockerignore`, `package.json`, `package-lock.json`, `scheme.txt`, `.env.example` (and `.env` if present) to `backend/`.

- [ ] **Step 2: Update `backend/package.json` scripts**
  Clean up frontend-specific scripts from `backend/package.json`:
  ```json
  {
    "name": "fuel-sync-backend",
    "version": "1.0.0",
    "main": "server.js",
    "scripts": {
      "test": "jest --runInBand --detectOpenHandles",
      "migrate": "node scripts/runMigrations.js",
      "start": "node server.js",
      "dev": "node --watch server.js"
    }
  }
  ```

- [ ] **Step 3: Update `backend/jest.config.js`**
  Remove `<rootDir>/frontend/` ignore pattern since `frontend` is no longer a child directory of backend:
  ```javascript
  module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testPathIgnorePatterns: ['/node_modules/'],
  };
  ```

- [ ] **Step 4: Run backend tests to verify migration integrity**
  Run from `backend/`: `npm test -- --silent`
  Expected: PASS (all 32 test suites, 349 tests pass).

---

### Task 2: Configure Frontend API Client for Standalone Deployment

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/.env.example`
- Test: `frontend/src/services/__tests__/api.test.js`

**Interfaces:**
- Consumes: `import.meta.env.VITE_API_URL`
- Produces: Axios instance `api` and silent refresh mechanism configured for configurable standalone domains.

- [ ] **Step 1: Add unit test in `frontend/src/services/__tests__/api.test.js` for `VITE_API_URL` resolution**
  Write tests asserting:
  - When `VITE_API_URL` is set, `baseURL` incorporates the custom URL without trailing slashes.
  - When `VITE_API_URL` is empty, `baseURL` falls back to `/api/v1`.
  - Silent refresh calls target the configured URL.

- [ ] **Step 2: Run frontend test to verify failure**
  Run: `npm --prefix frontend test -- -t "API Service and Interceptors"`
  Expected: FAIL on the new assertion for custom `VITE_API_URL`.

- [ ] **Step 3: Implement dynamic `baseURL` resolution in `frontend/src/services/api.js`**
  Update `frontend/src/services/api.js`:
  ```javascript
  const rawBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
  const baseURL = rawBase ? `${rawBase}/api/v1` : '/api/v1';

  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
  ```
  And update the refresh call in the response interceptor:
  ```javascript
  const refreshUrl = `${rawBase}/api/v1/auth/refresh`;
  const response = await axios.post(
    refreshUrl,
    { refreshToken },
    ...
  );
  ```

- [ ] **Step 4: Run frontend tests to verify they pass**
  Run: `npm --prefix frontend test`
  Expected: PASS (all 22 test files, 111+ tests pass).

---

### Task 3: Configure Root Helpers, `.gitignore`, and Update `docker-compose.yml`

**Files:**
- Create: `package.json` (root convenience scripts)
- Modify: `docker-compose.yml`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `backend/` and `frontend/` directories.
- Produces: Root convenience scripts, clean version control ignore rules, and working optional Docker Compose setup.

- [ ] **Step 1: Create root `package.json` with convenience scripts**
  Add scripts to run both apps easily from the workspace root:
  ```json
  {
    "name": "fuel-sync-workspace",
    "private": true,
    "scripts": {
      "dev:backend": "npm --prefix backend run dev",
      "dev:frontend": "npm --prefix frontend run dev",
      "test:backend": "npm --prefix backend test",
      "test:frontend": "npm --prefix frontend test",
      "test": "npm run test:backend && npm run test:frontend",
      "build:frontend": "npm --prefix frontend run build"
    }
  }
  ```

- [ ] **Step 2: Update `docker-compose.yml` for new backend path**
  Change `services.backend.build.context` from `.` to `./backend`, and volumes from `.:/app` to `./backend:/app`.

- [ ] **Step 3: Update `.gitignore`**
  Add rules for `backend/node_modules/`, `backend/.env`, `frontend/node_modules/`, `frontend/.env`, `frontend/dist/`.

- [ ] **Step 4: Verify Docker Compose configuration syntax**
  Run: `docker compose config`
  Expected: Valid YAML output with exit code 0.

---

### Task 4: End-to-End Verification and Documentation

**Files:**
- Modify: `README.md`
- Verify: Full test suites and build

- [ ] **Step 1: Update `README.md`**
  Document the new project layout:
  - Architecture breakdown (`backend/` vs `frontend/`).
  - How to run locally without Docker (`cd backend && npm run dev`, `cd frontend && npm run dev`).
  - How to deploy frontend and backend separately to cloud platforms.
  - How to optionally run via Docker Compose.

- [ ] **Step 2: Verify backend execution without Docker**
  Start backend process, test `GET http://localhost:3000/api-docs` or check process initialization, and terminate cleanly.

- [ ] **Step 3: Run full backend and frontend test suites**
  Run: `npm test` from root (runs `npm run test:backend && npm run test:frontend`).
  Expected: Both suites pass completely.

- [ ] **Step 4: Run frontend production build**
  Run: `npm --prefix frontend run build`
  Expected: Clean build output in `frontend/dist`.
