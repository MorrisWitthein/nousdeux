## ADDED Requirements

### Requirement: Create an event suggestion

A user SHALL be able to create an event suggestion with the same fields as an event (title required; optional date, end date, time, badge). The suggestion SHALL be recorded as pending and attributed to the creating user.

#### Scenario: Suggest an event

- **WHEN** a user creates an event suggestion with a title
- **THEN** the suggestion is stored with status pending and attributed to that user
- **AND** it does not appear on the shared calendar

#### Scenario: Suggestion requires a title

- **WHEN** a user attempts to create a suggestion without a title
- **THEN** the request is rejected with a validation error

### Requirement: The other user is notified of pending suggestions

Pending suggestions created by one user SHALL surface as in-app notifications for the other user, and SHALL update live via SSE without a reload. A user SHALL NOT be notified of their own suggestions.

#### Scenario: Receive a suggestion live

- **WHEN** user A creates a suggestion
- **THEN** user B sees it appear in their notifications without reloading

#### Scenario: Own suggestions are not self-notified

- **WHEN** user A views their notifications
- **THEN** suggestions that user A created are not listed there

### Requirement: Accept a suggestion creates a calendar event

Accepting a pending suggestion SHALL create exactly one event on the shared calendar using the suggestion's fields and SHALL mark the suggestion accepted. Accepting an already-resolved suggestion SHALL NOT create an additional event.

#### Scenario: Accept a suggestion

- **WHEN** the recipient accepts a pending suggestion
- **THEN** a single calendar event is created from the suggestion's fields
- **AND** the suggestion is marked accepted and leaves the notifications list
- **AND** the new event appears on the calendar live

#### Scenario: Accept is idempotent

- **WHEN** a suggestion that is already accepted is accepted again
- **THEN** no additional event is created

### Requirement: Decline a suggestion

Declining a pending suggestion SHALL mark it declined without creating any calendar event and SHALL remove it from the notifications list.

#### Scenario: Decline a suggestion

- **WHEN** the recipient declines a pending suggestion
- **THEN** the suggestion is marked declined
- **AND** no calendar event is created
- **AND** it leaves the notifications list
