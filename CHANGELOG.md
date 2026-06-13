# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.21.0] - 2026-06-13

### Changed
- **Termin vorschlagen ist jetzt eine Checkbox** statt eines eigenen Knopfs: Im Formular „Neuer Termin“ gibt es das Häkchen **„Als Vorschlag senden“**. Ist es gesetzt, heißt der Knopf **„Vorschlagen“** und der Termin geht erst als Vorschlag an die andere Person; ohne Häkchen wird der Termin wie gewohnt direkt gespeichert.

### Added
- **Gegenvorschlag**: Wer einen Terminvorschlag erhält, kann mit **„Anderer Termin“** ein abweichendes Datum/Uhrzeit vorschlagen. Der Vorschlag geht dann zurück an die andere Person, die ihn annehmen, ablehnen oder erneut einen Gegenvorschlag machen kann – so lange, bis jemand annimmt. Beim Annehmen entsteht der Termin mit den zuletzt vorgeschlagenen Daten.
- **Status der gesendeten Vorschläge**: Die Glocke hat jetzt zwei Tabs – **„Erhalten“** (Vorschläge, die auf deine Antwort warten) und **„Gesendet“** (von dir verschickte Vorschläge mit Status **Ausstehend**, **Angenommen** oder **Abgelehnt**).

---

## [0.20.0] - 2026-06-13

### Added
- **Terminvorschläge**: Statt einen Termin direkt einzutragen, könnt ihr ihn jetzt der anderen Person **vorschlagen**. Im Formular „Neuer Termin“ gibt es dafür unter „Speichern“ die Aktion **„Stattdessen vorschlagen“**. Der Vorschlag landet bei der anderen Person als Benachrichtigung – oben in der Kopfzeile erscheint eine **Glocke** mit der Anzahl offener Vorschläge. Dort lässt sich jeder Vorschlag **annehmen** (er wird zu einem echten Termin im Kalender) oder **ablehnen**. Neue Vorschläge erscheinen live, ohne die App neu zu laden. Eigene Vorschläge zeigt die Glocke nicht an.

---

## [0.19.0] - 2026-06-13

### Changed
- Filme & Serien: Die TMDB-Suche braucht keinen eigenen Button **„🔍 In TMDB suchen“** mehr. Stattdessen ist das **Titel**-Feld jetzt selbst die Suche: Beim Tippen erscheint direkt darunter eine Liste passender Treffer mit Poster und Jahr. Per Tipp auf den richtigen Treffer werden Poster, Genre und Plattform übernommen. Wer nichts auswählt, kann wie bisher alles manuell eintragen. Das Poster wird erst angezeigt, sobald eines gesetzt ist.

---

## [0.18.4] - 2026-06-13

### Fixed
- Dunkelmodus: Die Ränder links und rechts neben der App (auf breiteren Bildschirmen) erscheinen jetzt ebenfalls dunkel statt im hellen Farbton.

---

## [0.18.0] - 2026-06-13

### Added
- **Dunkelmodus**: Die App lässt sich jetzt in einem dunklen Farbschema anzeigen. Im Profil gibt es unter **Darstellung** einen Schalter **„Dunkelmodus“**, der sofort zwischen hell und dunkel umschaltet. Die Wahl wird pro Gerät gespeichert und beim nächsten Öffnen ohne Aufflackern wiederhergestellt. Wer noch nichts ausgewählt hat, startet automatisch im zum Systemdesign (`prefers-color-scheme`) passenden Modus.

---

## [0.17.0] - 2026-06-13

### Changed
- Filme und Serien: Poster und Infos (Genre, Plattform) werden nicht mehr automatisch aus dem ersten Treffer übernommen. Stattdessen gibt es im Hinzufügen- und Bearbeiten-Formular einen Button **„🔍 In TMDB suchen“**, der alle gefundenen Titel mit Poster und Jahr auflistet. Per Tipp auf den richtigen Treffer werden Poster, Genre und Plattform ins Formular übernommen – so lassen sich mehrdeutige Titel (z. B. Remakes) eindeutig zuordnen. Wird nichts Passendes gefunden, können alle Felder weiterhin manuell ausgefüllt werden.

---

## [0.16.5] - 2026-06-13

### Fixed
- Navigationsleiste sitzt in der installierten Homescreen-PWA (iOS) jetzt bündig am unteren Bildschirmrand. Die Leiste lief vorher im normalen Layoutfluss mit und endete oberhalb des echten Bildschirmrands, weil `100dvh` in iOS-Standalone-PWAs nicht bis zur Home-Indicator-Zone reicht. Sie ist jetzt fix am Viewport-Boden verankert (mit Safe-Area-Abstand für die Beschriftungen), und der Inhaltsbereich hat unten entsprechend Platz, damit nichts hinter der Leiste verschwindet.

---

## [0.16.4] - 2026-06-13

### Fixed
- Weißer/leerer Streifen am unteren Rand der als App installierten Homescreen-PWA (iOS) ist weg. Der App-Rahmen nutzte intern noch eine prozentuale Höhe (`height: 100%`), die in iOS-Standalone-PWAs unzuverlässig ist und die Navigationsleiste oberhalb des echten Bildschirmrands enden ließ. Er wird jetzt direkt über `100dvh` gesteuert, und der Seitenhintergrund ist cremefarben hinterlegt, damit unterhalb der sicheren Zone nie Weiß durchscheint.

---

## [0.16.3] - 2026-06-11

### Fixed
- Cremefarbener Streifen am unteren Rand in der installierten Homescreen-App ist weg. Die App-Höhe wird jetzt über `100dvh` (volle Bildschirmhöhe inkl. Safe-Area) statt über prozentuale Höhen gesteuert, die in iOS-Standalone-PWAs unterhalb der sicheren Zone enden.

---

## [0.16.2] - 2026-06-11

### Fixed
- Navigationsleiste klebt jetzt zuverlässig am unteren Bildschirmrand – auch in der als App installierten Variante (Homescreen-PWA). Der App-Rahmen wird fix am Viewport verankert statt über prozentuale Höhen, die in iOS-Standalone-PWAs unzuverlässig sind.

---

## [0.16.1] - 2026-06-11

### Fixed
- Navigationsleiste sitzt jetzt korrekt am unteren Bildschirmrand – kein Leerraum darunter mehr und sie verdeckt keine Inhalte mehr. Der Abstand zur iOS-Home-Anzeige passt sich automatisch an.

---

## [0.16.0] - 2026-06-11

### Changed
- App hat jetzt ein festes Layout: Der Bildschirm bleibt fixiert und das störende „Mitziehen"/Zurückschnappen beim Wischen auf iOS ist weg. Nur lange Listen scrollen noch – innerhalb des Inhaltsbereichs.

---

## [0.15.0] - 2026-06-11

### Changed
- Plattform-Feld bei Filmen und Serien ist jetzt eine Auswahlliste mit den großen Streaming-Diensten (Netflix, Prime, Disney+, HBO, WOW) statt eines Freitextfelds.
- Automatische Plattform-Erkennung liefert nur noch einen einzelnen dieser Dienste – Amazon Channels und Nischenanbieter werden nicht mehr angezeigt.

---

## [0.14.1] - 2026-06-10

### Changed
- Großer interner Umbau: Listen-Tab in vier eigenständige Unter-Tabs (Serien, Filme, Aktivitäten, Einkauf) und Kalender-Tab in Einzelteile (Monatsraster, Termin-Formular, Termin-Detail, Swipe-Logik) aufgeteilt. Keine sichtbaren Funktionsänderungen.
- Speichern-Buttons sind jetzt deaktiviert, solange kein Titel eingegeben wurde (einheitlich in allen Formularen).

### Fixed
- Tastatur-Bedienbarkeit: Karten, Statistik-Kacheln, Kalendertage, Sterne-Bewertung, Navigations-Tabs und das Datum auf dem Home-Screen sind jetzt per Tab-Taste erreichbar und mit Enter/Leertaste aktivierbar; ein sichtbarer Fokusring wurde ergänzt.

---

## [0.14.0] - 2026-06-09

### Added
- Filme und Serien holen beim Hinzufügen jetzt automatisch Genre und verfügbare Streaming-Plattform(en) von TMDB (Region Deutschland) — ein kleiner Lade-Spinner auf der Karte zeigt, während die Infos abgerufen werden. Manuell eingetragene Werte werden nicht überschrieben.

### Changed
- Karten in Filme/Serien neu gestaltet: Plattform als hervorgehobener Chip mit Streaming-Symbol, Genre/Staffel als dezente Chips — visuell klar unterscheidbar.

### Removed
- Emoji-Eingabefeld in den Film- und Serien-Formularen entfernt; ein fester Standard dient als Rückfallbild, wenn kein Poster gefunden wird.

---

## [0.13.1] - 2026-06-09

### Changed
- Redesigned the Filme and Serien cards: the poster now spans the full height of the card on the left, with title, status, tags and author in a content column on the right — a larger, more modern poster-forward layout.

---

## [0.13.0] - 2026-06-09

### Added
- Filme and Serien now show poster thumbnails, auto-fetched from The Movie Database (TMDB) when added — shown on the list card and enlarged in the detail sheet, falling back to the emoji when no poster is found. The edit sheet lets you refresh or remove a poster.

---

## [0.12.0] - 2026-06-04

### Added
- "Passwort ändern" in the profile sheet: every user can change their own password (re-entering the current one), backed by user accounts that now live in the database instead of only the environment

---

## [0.11.0] - 2026-06-04

### Added
- Serien, Filme and Aktivitäten cards now show who added them ("Von … hinzugefügt"), matching the Termine and Rezepte cards — visible both on the list card and in the detail sheet

### Changed
- Reworked the Serien / Filme / Aktivitäten list items into the same card layout used for Termine and Rezepte: a header (emoji, title, status) with the edit/delete actions laid out in a horizontal footer row instead of cramped vertical buttons
- Card info is cleaner: season & platform (Serien) and genres & platform (Filme) now render as tag chips instead of a single muted line

### Fixed
- The undo banner shown after deleting a record is no longer hidden behind the iOS status bar / notch / Dynamic Island — the toast now respects the top safe-area inset so its "Rückgängig" button stays tappable on iPhones
- Calendar month swipe feels natural: the month header no longer changes until the neighbouring month is actually the dominant one on screen, and a slow drag snaps back to the current month unless you pull past halfway — while a quick flick still pages through even on a short swipe

---

## [0.10.1] - 2026-06-03

### Changed
- The profile screen now opens as the same bottom slide-up sheet used everywhere else (with swipe-to-dismiss and a header), replacing the hand-rolled modal — consistent look and behaviour, no visual content change

---

## [0.10.0] - 2026-06-03

### Added
- Empty states across all tabs: the calendar (no events for the month, or a tapped day with no events), Serien, Filme and Aktivitäten lists, and Rezepte now show a friendly placeholder instead of a blank screen when there is nothing yet (or no search/filter matches)
- Loading state on initial fetch: the home screen now shows `–` instead of a confidently wrong `0` for its stat counts while data is still loading, and the empty-state placeholders no longer flash before the first fetch completes

### Changed
- Add and edit forms in the calendar and lists tabs now open as a bottom slide-up sheet (with swipe-to-dismiss), matching the recipes tab — replacing the inline form that appeared at the top of the list and auto-scrolled the page to reach it
- Deleting an event, series, movie, activity or recipe no longer pops a native browser confirm dialog — the item is removed immediately and a "Gelöscht · Rückgängig" toast lets you undo the delete, so an accidental deletion in this shared app is recoverable
- Author attribution colours (header avatar, profile avatar and every author dot) now run through a single shared helper, so the header/profile avatar follow the same "your items are teal, your partner's are red" scheme used everywhere else instead of a hardcoded colour (no visible change; internal consistency cleanup)

---

## [0.9.11] - 2026-06-02

### Changed
- Calendar: the "Heute" button now jumps to the current month without selecting today's date

---

## [0.9.10] - 2026-06-02

### Changed
- Calendar: tapping anywhere outside the calendar, cards or buttons now clears the day selection, replacing the old "Alle anzeigen" button
- Listen: the selected sub-list (Serien / Filme / Aktivitäten / Einkauf) is now remembered when switching to another tab and back
- Listen: completed items (Serien „Fertig", Filme „Gesehen", Aktivitäten „Gemacht") are now hidden by default in a collapsible "Erledigt" section

---

## [0.9.9] - 2026-06-02

### Changed
- Calendar: added whitespace between month panels so the boundary between two months is clearly visible while swiping (and holding mid-drag)

---

## [0.9.8] - 2026-05-31

### Changed
- Calendar: month navigation is now a real carousel — prev, current and next months render in a sliding track, so a neighbouring month always slides into view during a swipe instead of revealing empty space
- Calendar: the `‹` / `›` buttons now animate the slide (same transition as a swipe) instead of swapping the grid instantly
- Calendar: every month reserves a fixed 6-row height so sliding between months no longer jumps vertically

---

## [0.9.7] - 2026-05-08

### Fixed
- Calendar: past events no longer shown in the list below the calendar (only upcoming events are displayed; multi-day events ending today or later are still shown)
- Calendar: selected-day circle highlight now renders correctly on mobile (fixed `z-index` interaction with `will-change: transform` stacking context; suppressed native tap highlight via `-webkit-tap-highlight-color`)
- Sheet: swipe-down-to-close gesture on the handle and header; sheet translates with the finger and closes when dragged past 80 px, or snaps back if released early; backdrop fades proportionally

---

## [0.9.6] - 2026-05-08

### Changed
- Calendar day highlights (today, selected, hover) now use a circle around the day number instead of a full-cell background fill

---

## [0.9.5] - 2026-05-08

### Changed
- Redesigned calendar event indicators: multi-day events now show as color-coded spanning bars (teal = Morris, red = Dinah) with consistent lane assignment per week row; single-day events show as a single dot
- Calendar cells are taller to accommodate a dedicated event lanes area, eliminating bar overlap with day numbers

---

## [0.9.4] - 2026-05-08

### Added
- Secret admin menu in profile modal (visible only to users with the `admin` JWT claim)
- Gen-Z mode toggle in admin menu — when enabled, replaces the home greeting with gen-z slang for all users regardless of date

---

## [0.9.3] - 2026-05-08

### Changed
- Add global error handling for all user interactions

---

## [0.9.2] - 2026-05-08

### Changed
- Save/cancel buttons restyled: pill shape (border-radius 28px), accent glow on Save, outlined ghost on Cancel
- File upload buttons restyled: ghost text style (no border) with paperclip icon on all upload/file-select buttons

---

## [0.9.1] - 2026-05-08

### Fixed
- Header and content area padding reduced for a more compact layout
- Tag dropdown positioning corrected (no longer overflows container edges)
- Recipe search clear button vertically centered in the input field

---

## [0.9.0] - 2026-05-08

### Added
- Recipe to shopping list: cart button on recipe cards and in the detail view opens a sheet pre-filled with the recipe's ingredients; individual items can be edited or removed before adding to the list

---

## [0.8.3] - 2026-05-08

### Added
- Recipe search now suggests existing tags in a dropdown as you type
- Clear button (×) on the recipe search input to reset the query instantly

---

## [0.8.2] - 2026-05-08

### Fixed
- Recipe edit form: step textareas now auto-resize to fit existing multi-line content when the edit sheet opens

---

## [0.8.1] - 2026-05-07

### Fixed
- Remove embla-carousel and revert back to custom logic for calender component

---

## [0.8.0] - 2026-05-04

### Added
- Recipe search — filter recipes by name or ingredient as you type
- Swipe between calendar months using embla-carousel — three month slides (prev/current/next) are rendered simultaneously so the gesture reveals the adjacent month instantly

---

## [0.7.3] - 2026-05-02

### Changed
- Shopping list autocomplete suggestions are now stored permanently — items added once will always appear as suggestions, even after the list is cleared

---

## [0.7.2] - 2026-05-02

### Changed
- Shopping list quantities are now stored separately from item names — entering "200g Joghurt" saves `qty=200g` and `name=Joghurt`, keeping autocomplete suggestions clean
- Quantity is displayed muted before the item name (both unchecked and checked items)
- Autocomplete suggestions now trigger on the name fragment even when a quantity prefix is typed (e.g. "200g J" suggests "200g Joghurt")

---

## [0.7.1] - 2026-05-02

### Changed
- Shopping list now syncs between users via the API (PostgreSQL-backed) instead of localStorage — items added by Max are immediately visible to Lena and vice versa
- Autocomplete history is now derived from existing items fetched from the API (no separate localStorage key)

---

## [0.7.0] - 2026-05-02

### Added
- Shopping list tab in the Lists section with localStorage persistence
- Autocomplete suggestions based on previously entered items
- Per-item check-off while shopping; checked items move to an "Erledigt" section
- Quick delete button per item
- "Erledigte löschen" button to clear only checked items
- Author indicator dot (coloured per user) on each item

---

## [0.6.2] - 2026-04-30

### Fixed
- Add button covering delete and edit options for items in lists

---

## [0.6.1] - 2026-04-30

### Fixed
- Recipe import: ingredient quantities (e.g. `200g`) are now parsed into the dedicated quantity field instead of being lumped into the ingredient name
- Recipe import: removed duplicate loading spinner on the "Importieren" button (the spinner above the button row is sufficient)
- Recipe import: Claude prompt now strips possessives and marketing adjectives from the dish title (e.g. "Grandma's Original Spaghetti Carbonara" → "Spaghetti Carbonara")

### Changed
- Merged the two recipe FAB buttons (create + import) into a single speed-dial FAB: tap `+` to expand a mini-menu with "Erstellen" and "Importieren" options; tap outside or choose an option to close

---

## [0.6.0] - 2026-04-30

### Added
- Recipe import: a teal import FAB on the Recipes tab opens an "Importieren" sheet where you can paste a URL or pick a photo; Claude extracts title, emoji, tags, ingredients, steps, prep time and servings (translated to German) and pre-fills the add form for review before saving

---

## [0.5.4] - 2026-04-30

### Added
- Recipe image upload in the create form: a "Bild hochladen" button lets you pick a local file; if chosen it is used instead of the Unsplash auto-fetch
- Recipe edit form now shows the current image with options to upload a replacement or remove it

### Changed
- All "add" buttons (Calendar, Lists: series/activities/movies, Recipes) are now floating action buttons (FAB) instead of full-width inline buttons, consistent with the PWA's mobile-first layout; FAB position uses `calc(max(0px, (100vw - 390px) / 2) + 24px)` so it stays 24 px from the right edge on wide screens, raised to 100 px above the bottom edge
- Calendar event list now starts from the first day of the currently viewed month (not today); paginated 5 at a time with a "Mehr anzeigen (N weitere)" button; resets when switching months or selecting a day
- Series add form: Platform field now has a visible label; season/status fields no longer use fixed flex widths

### Fixed
- Inputs, selects, and textareas inside `.form-row` no longer add an extra bottom margin

---


## [0.5.3] - 2026-04-27

### Added
- Calendar: edit form now has an attachment upload section ("Datei wählen") matching the create form — files are queued and uploaded when saving

### Fixed
- API errors (e.g. missing date) are no longer swallowed silently — the error message from the server is shown in red above the form buttons for both create and edit

---

## [0.5.2] - 2026-04-27

### Fixed
- Uploads larger than 1 MB no longer fail with 413 — nginx `client_max_body_size` raised to 25 MB to match the API limit

---

## [0.5.1] - 2026-04-27

### Added
- Calendar: attachments can now be added while creating an event ("Neuer Termin" form) — files are queued and uploaded after the event is saved
- Calendar: event cards show a paperclip icon and count when an event has attachments, without opening the detail view

---

## [0.5.0] - 2026-04-27

### Added
- Calendar: event detail sheet now shows an "Anhänge" section — list, download, upload, and delete file attachments per event (backed by the new API endpoints)

---

## [0.4.1] - 2026-04-27

### Added
- Calendar: tapping an event card opens a detail sheet (title, date/time, badge, author) with an edit button
- Lists: tapping a series, movie, or activity opens a detail sheet; activities include a shortcut to add as a calendar event

---

## [0.4.0] - 2026-04-25

### Added
- Recipes: automatic Unsplash photo fetched and stored for each new recipe (shown on card and detail sheet)
- Recipes: recipe form redesigned as a bottom sheet with inline ingredient and step lists
- Recipes: pressing Enter in an ingredient or step field inserts a new row below and focuses it (Shift+Enter is a no-op); the add buttons also auto-focus the new field

---

## [0.3.3] - 2026-04-25

### Added
- Home screen greeting emoji reflects current Hamburg weather (fetched from Open-Meteo, cached 2 h server-side); falls back to time-of-day emoji when unavailable

---

## [0.3.2] - 2026-04-24

### Added
- Activities: 📅 button on each card navigates to the calendar tab and opens the new-event form pre-filled with the activity's title and emoji — event is only created when the user confirms

---

## [0.3.1] - 2026-04-24

### Added
- April 1st Easter egg on the home screen: random label and emoji from a pool of Gen-Z phrases

### Fixed
- Calendar no longer shows events from other years when months share the same number (e.g. April 2025 events leaking into April 2026)
- Next-event card on home screen now shows "Heute" / "Morgen" / weekday name instead of raw ISO date; hides the time separator when no time is set

### Changed
- Form close/delete icon buttons enlarged (28 px → 36 px) for easier tap targets
- Minor holiday label tweaks: "Frohen Dreikönigstag", "Besinnlichen Allerheiligen", "Besinnlichen Karfreitag"
- Night greeting punctuation fix: "Spät noch wach?" (was missing the question mark)

---

## [0.3.0] - 2026-04-23

### Added
- Filme list in the Listen tab: add, edit, and delete movies with emoji, title, sub-info (year/genre/platform), and Geplant/Gesehen status
- Bücher tab removed (watching together, not reading)
- Tag chip input for recipe tags and movie genres: type to autocomplete from existing values, press Enter or comma to confirm, Backspace to remove the last chip
- Movies now support multiple genres (array instead of single text field); existing data is migrated automatically
- Filter bar above recipe list and movie list: click any tag/genre to filter, click again to deselect

### Changed
- Series form: replaced opaque "Fortschritt %" with a "Staffel" number and a dedicated "Plattform" field
- Movies form: split single "Jahr / Genre / Plattform" field into separate Genre and Plattform inputs; removed year
- Activities: removed date/time inputs (ideas belong here, scheduled items go in Events); added Idee/Geplant/Gemacht status to track bucket-list progress

## [0.2.6] - 2026-04-22

### Fixed
- Horizontal swipe on calendar no longer triggers vertical page scroll

## [0.2.5] - 2026-04-22

### Changed
- Calendar month swipe now animates: grid slides out in the swipe direction and the new month slides in from the opposite side
- Heute button restyled as a wider pill to fit the label

## [0.2.4] - 2026-04-22

### Added
- Swipe left/right on the calendar grid to switch months
- Heute button to jump back to the current month and day
- Version number in profile links to GitHub release notes

## [0.2.3] - 2026-04-22

### Fixed
- Compact calendar indicator stack
- End date picker now opens on the start date's month
- Multi-day stripe segments stay at consistent height
- Multi-day stripe overlap with stacked events

## [0.2.2] - 2026-04-01

### Added
- Multi-day events with stripe visualization on the calendar

### Fixed
- Scroll forms into full view on mobile
- Navigate to correct month when tapping a calendar event
- Date/time input height on iOS Safari
- Calendar event sorting and past-event filtering
- Overlapping date & time buttons

## [0.2.1] - 2026-03-15

### Added
- Version number shown in profile sheet

### Fixed
- iOS SSE reconnect on app backgrounding
- Form row overlap on small screens
- Next event sort order

## [0.2.0] - 2026-03-01

### Added
- Profile sheet with logout
- Navigation shortcuts
- Aktivitäten tab
