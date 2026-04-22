# Monorepo: Expo React Native + Node.js Backend

## Structure
- `mobile/` — Expo SDK 54, React Native with TypeScript. Use the Expo managed workflow.
- `backend/` — Node.js + Express + TypeScript API server.

## Running
- Backend: `npm run backend` (from root) or `cd backend && npm run dev`
- Mobile: `npm run mobile` (from root) or `cd mobile && expo start`
- Install all deps: `npm run install:all`

## Communication
- The mobile app connects to the backend via `mobile/src/api.ts`.
- The backend URL defaults to `http://localhost:3000` (auto-adjusted for Android emulator).
- Override with `EXPO_PUBLIC_API_URL` env var in mobile.
- Backend has CORS enabled for cross-origin requests.
