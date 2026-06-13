## ADDED Requirements

### Requirement: Stat cards open a statistics detail view

Tapping a home-screen stat card SHALL open a statistics detail view for that resource type rather than navigating directly to its tab.

#### Scenario: Open the detail view

- **WHEN** the user taps a stat card on the home screen
- **THEN** a statistics detail view for that resource opens
- **AND** its headline figure matches the number shown on the card

### Requirement: In-depth per-resource statistics

The detail view SHALL present in-depth statistics for the selected resource beyond the single headline number, including relevant breakdowns (such as by author, status, platform, tag, or rating depending on the resource).

#### Scenario: Event statistics breakdown

- **WHEN** the events statistics detail view is open
- **THEN** breakdowns relevant to events are shown (such as counts by author and upcoming vs. past)

### Requirement: Historic data and visualisations

The detail view SHALL present historic data over time derived from existing record timestamps and SHALL render lightweight visualisations without a heavy charting dependency.

#### Scenario: Historic trend over time

- **WHEN** a statistics detail view is open
- **THEN** a trend of items over time (bucketed by month) is shown as a lightweight visualisation

### Requirement: Return and manage paths

The detail view SHALL provide a way to return to the home screen and a way to navigate to the resource's full tab for managing items.

#### Scenario: Leave the detail view

- **WHEN** the user chooses to go back from the statistics detail view
- **THEN** the home screen is shown again

#### Scenario: Go to the resource tab

- **WHEN** the user chooses to manage items from the detail view
- **THEN** the corresponding resource tab opens
