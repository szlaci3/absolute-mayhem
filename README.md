# Absolute Mayhem
A browser-based conversational world studio set in a flooded observatory. An isometric canvas renderer, rules and simulation run in the browser. Only world edits and startup model probes use the server-side Google Gemini endpoint.

## Run
Use Node 24.5+ and npm. From the checkout:

```sh
npm ci
npm test
npm run build
NODE_ENV=production npm start
```

Open http://127.0.0.1:3000. For development use `npm start`, which serves public/ directly. PORT and HOST override the default local listener. A server-side Node host can run the production command with HOST=0.0.0.0. The build has no third-party runtime dependencies.

## Play and edit
Move with WASD or arrows. Press E near objects or click an object to walk up and use it. Light the tide lantern, align the meridian lens, cross the lightspan and wake the orrery. The objective panel guides each step. The browser saves simulation state and twelve pre-edit checkpoints locally. Undo restores position, rules, variables and timer deadlines together. Simulation time pauses in hidden tabs.

The offline compiler is deterministic. Try the three composer suggestions, or combine sentences over named objects:

- Add a bell at 4,5
- Add a gate at 5,5
- When I ring the bell, increment charge by 1
- When I ring the bell, open the gate for 5 seconds only if charge is at least 1

Conditions read the pre-event state, so the second ring opens this gate. Inspect rule definitions, objects, variables, countdowns and recent fired events in the inspector. The journal records edit provenance and failures. Unsupported freeform requests need a connected model.

## Live model configuration
Bind GEMINI_API_KEY as a server secret for generativelanguage.googleapis.com and restart the server. Never prefix it for browser exposure. For a cloud proxy, enable Node's environment proxy support with NODE_USE_ENV_PROXY=1. Run `npm run probe` for a stand-alone readiness check. Startup probes Hydrogen first with a structured bell patch and validates its shape and behavior. On failure it probes Flash Lite. A normal edit makes one model request. Quota/provider failures on the primary trigger a verified fallback attempt. The model details control explains selection and availability. Local edits never masquerade as provider output.

The server caps edits at 30 requests/hour across one process and one concurrent edit. Multiple instances would require a shared limiter. Startup probes consume provider quota. This prototype has no shared accounts or multiplayer.

## Browser checks
With Python Playwright and system Chromium available, start the production server and run `python checks/browser.py` against a credential-free instance. For the explicitly synthetic provider integration check, run `PORT=3101 NODE_ENV=production node --import ./checks/provider-fixture.js server.js` in a separate terminal and `python checks/fallback.py`. This injects a transport fixture only into that test server. It never contacts Gemini.
