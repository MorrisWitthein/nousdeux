# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
