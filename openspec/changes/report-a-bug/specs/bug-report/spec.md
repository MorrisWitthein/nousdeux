## ADDED Requirements

### Requirement: Report a bug from the profile

The profile modal SHALL provide a control that opens the project's GitHub new-issue page in a new browser tab.

#### Scenario: Open the bug report

- **WHEN** the user taps "Fehler melden" in the profile modal
- **THEN** the GitHub new-issue page for the project opens in a new tab

### Requirement: The new issue is prefilled with context

The opened GitHub issue SHALL be prefilled with a title and a body, and the body SHALL include the current app version and the browser user-agent string along with a short report template.

#### Scenario: Prefilled body contains version and browser

- **WHEN** the bug report page opens
- **THEN** the issue body contains the current app version
- **AND** the issue body contains the browser user-agent string
- **AND** the issue body contains a template prompting for what happened, expected behaviour, and steps to reproduce
