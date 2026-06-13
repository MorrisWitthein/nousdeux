## 1. Issue URL builder

- [ ] 1.1 Add a helper that builds a `https://github.com/MorrisWitthein/nousdeux/issues/new` URL with URL-encoded `title` and `body` query params
- [ ] 1.2 Populate the body with `App-Version: v${__APP_VERSION__}`, the browser user agent, and a short German template (Was ist passiert? / Erwartetes Verhalten / Schritte zum Reproduzieren)

## 2. Profile modal button

- [ ] 2.1 In `src/components/ProfileModal.jsx`, add a "Fehler melden" button grouped with the existing meta/account actions
- [ ] 2.2 The button opens the built URL in a new tab using `target="_blank"` and `rel="noopener noreferrer"`, matching the existing version link

## 3. Verification

- [ ] 3.1 Verify tapping the button opens GitHub's new-issue page with the title and body prefilled
- [ ] 3.2 Verify the body shows the correct app version and the browser user agent
- [ ] 3.3 Verify the link opens in a new tab and does not navigate away from the app

## 4. Release bookkeeping

- [ ] 4.1 Bump `package.json` `version` (patch or minor) and add a `CHANGELOG.md` section for the release
