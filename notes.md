# Change Log Summary

## Backend (server/index.js)
- Added Express-based API with WebSocket support for real-time 1v1 challenges.
- Implemented Supabase integration (using env vars) to handle player profiles, ratings, scores, and leaderboard endpoints.
- Challenge routes now broadcast state via websockets (join/leave/game update/start).

## Client Services
- `services/socketService.ts`: Replaced BroadcastChannel mock with reconnecting WebSocket client (join/leave, emit, reconnect logic).
- `services/challengeService.ts`: Added REST helpers for challenge create/accept/get.
- `services/userService.ts`: New Supabase-backed user/leaderboard API layer.
- `services/localStorageService.ts`: Trimmed to only persist username locally.

## App Flow (App.tsx)
- Integrated Supabase login, rating persistence, and leaderboard refresh logic.
- Wired online challenge creation/acceptance to new REST + socket services.
- Ensured URL `/game/:id` links trigger auto-join when logging in.
- Guarded websocket cleanup on logout/end-game/cancel routines.

## UI Updates
- `components/LobbyScreen.tsx`: Removed mock player list; added share guidance.
- `components/LeaderboardScreen.tsx`: Fetch leaderboard from Supabase, show error state.
- `components/LoginScreen.tsx`: Simplified to rely on server-side profile creation.

## Config & Docs
- `package.json`: Added backend deps (`express`, `cors`, `ws`, `dotenv`, `@supabase/supabase-js`) and `npm run server` script.
- `README.md`: Documented running client/server plus Supabase schema setup.
- Added `notes.md` to summarize changes (this file).
