## ADDED Requirements

### Requirement: Upcoming-events overview is the default calendar view

When no day is selected, the calendar tab SHALL display the month grid followed by an "upcoming events" overview listing events from the start of the displayed month onward whose end date is today or later, sorted by date then time.

#### Scenario: No day selected shows upcoming events

- **WHEN** the calendar tab is opened and no day is selected
- **THEN** the month grid is shown
- **AND** below it an overview lists upcoming events for the displayed month, sorted by date then time

#### Scenario: Empty upcoming overview

- **WHEN** no day is selected and there are no upcoming events for the displayed month
- **THEN** an empty state is shown inviting the user to add an event

### Requirement: Tapping a day opens a single-day view

Tapping a day in the month grid SHALL open a single-day view focused on that date, replacing the upcoming-events overview. The single-day view SHALL show the selected weekday and full date prominently and list only the events occurring on that day (including multi-day events that span it), with the same add, edit, delete, and detail affordances as the overview.

#### Scenario: Select a day with events

- **WHEN** the user taps a day that has events
- **THEN** the single-day view opens showing that day's weekday and full date
- **AND** only events occurring on that day are listed

#### Scenario: Select a day spanned by a multi-day event

- **WHEN** the user taps a day that falls within a multi-day event's range
- **THEN** that event appears in the single-day view

#### Scenario: Select a day with no events

- **WHEN** the user taps a day that has no events
- **THEN** the single-day view opens with an empty state for that day

#### Scenario: Add an event from the single-day view

- **WHEN** the user adds an event while a day is selected
- **THEN** the new event form is prefilled with the selected date

### Requirement: User can return to the upcoming-events overview

The single-day view SHALL provide a clear way to leave it and return to the upcoming-events overview without changing the displayed month.

#### Scenario: Leave the single-day view

- **WHEN** the user is in the single-day view and chooses to return to the overview
- **THEN** the day selection is cleared
- **AND** the upcoming-events overview is shown for the same month

#### Scenario: Re-tapping the selected day clears selection

- **WHEN** the user taps the currently selected day again
- **THEN** the day selection is cleared and the upcoming-events overview is shown

### Requirement: Month navigation clears day selection

Navigating to a different month (previous, next, or "Heute") SHALL clear any active day selection and show that month's upcoming-events overview.

#### Scenario: Navigate months while a day is selected

- **WHEN** a day is selected and the user navigates to another month
- **THEN** the day selection is cleared
- **AND** the upcoming-events overview for the new month is shown
