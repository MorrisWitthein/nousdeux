## ADDED Requirements

### Requirement: Dark theme palette

The app SHALL provide a dark colour palette as an alternative to the default light palette, applied by overriding the design-system CSS variables under a theme selector, covering backgrounds, text, cards, borders, accents, badges, and chips.

#### Scenario: Dark theme is active

- **WHEN** the dark theme is active
- **THEN** backgrounds, text, cards, borders, badges, and chips use the dark palette with adequate contrast
- **AND** no element retains a light-mode-only colour that breaks contrast

### Requirement: Theme toggle in the profile

The profile modal SHALL provide a toggle that switches between light and dark themes, taking effect immediately.

#### Scenario: Toggle the theme

- **WHEN** the user toggles dark mode in the profile modal
- **THEN** the app switches to the chosen theme immediately without a reload

### Requirement: Theme persistence and default

The chosen theme SHALL persist per device across reloads and SHALL be applied before first paint. When the user has made no explicit choice, the initial theme SHALL follow the operating system's `prefers-color-scheme`.

#### Scenario: Choice persists across reloads

- **WHEN** the user has selected a theme and reloads the app
- **THEN** the previously selected theme is applied with no flash of the other theme

#### Scenario: Default follows the OS preference

- **WHEN** a user with no stored theme choice opens the app on a device set to dark mode
- **THEN** the app opens in the dark theme
