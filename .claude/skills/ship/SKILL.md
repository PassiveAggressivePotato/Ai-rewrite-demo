---
name: ship
description: Verify the current CRITIKL change in a browser, then deploy it — syntax-check, Playwright-verify, bump the service-worker cache, commit, and merge the feature branch to main. Use when the user says "ship it", "/ship", "deploy this", or after finishing a change they want live.
---

# /ship — verify & deploy a CRITIKL change

Run the project's standard build → test → deploy routine. Do each step in order and
stop to report if any step fails (never deploy on a failed check).

## Steps

1. **Syntax check** any edited JS:
   `node --check app.js` (and `node --check tasks.js`/`data.js`/`quotes.js` if touched).

2. **Verify in a browser (Playwright).** Serve the repo and drive an automated
   browser at phone size to confirm the change works and there are no console errors:
   - `python3 -m http.server 8765` (reuse if already running).
   - Playwright via `/opt/node22/lib/node_modules/playwright/index.js`, viewport
     `{ width: 430, height: 910 }`. Exercise the specific thing that changed.
   - Treat a cross-origin `ERR_CONNECTION_CLOSED` (fonts/artwork) as harmless.
   - For a **visual** change, capture a screenshot and offer it to the user before deploying.

3. **Bump the cache** if a shell asset changed: increment `CACHE` in `sw.js`
   (`scores-shell-vNN` → `vNN+1`). If a brand-new top-level file was added, also add
   it to the `cp` list in `.github/workflows/pages.yml` and the `SHELL` array in `sw.js`.

4. **Commit** to the current feature branch with a clear message ending in the
   project's Co-Authored-By / Claude-Session trailers. Then **push**
   (`git push -u origin <branch>`).

5. **Merge to `main`** (Pages deploys from `main`): fetch + checkout `main`, pull,
   `git merge --no-ff <branch>`, push `main`, then check the feature branch back out.

6. **Report**: confirm what was verified, that it's deployed, and remind the user to
   **hard-refresh or open a private/incognito tab** on their phone to bypass the cache.

Do NOT open a pull request unless the user explicitly asks.
