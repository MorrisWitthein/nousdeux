## ADDED Requirements

### Requirement: Structured metadata is visually distinct from free-form tags

Across all resource types (recipes, series, movies, activities), the UI SHALL render structured metadata (such as platform, season, rating, prep time, servings, status, or category) in a visual style distinct from free-form, user-entered tags, so users can tell them apart at a glance.

#### Scenario: A recipe with tags and metadata

- **WHEN** a recipe card or detail sheet shows both free-form tags and metadata (e.g. prep time, servings)
- **THEN** the tags are rendered in the tag style
- **AND** the metadata is rendered in the metadata style, visually distinct from the tags

#### Scenario: A movie keeps its existing platform/genre distinction

- **WHEN** a movie card shows a platform and genres
- **THEN** the platform is rendered as a prominent metadata chip
- **AND** the genres are rendered as neutral chips, unchanged from the prior behaviour

### Requirement: The distinction is applied consistently across resource types

The same two visual roles (metadata vs. tag) SHALL be used consistently for every resource type that displays chips or metadata rows, rather than each resource type defining its own divergent styling.

#### Scenario: Consistent styling across tabs

- **WHEN** a user views cards on the recipes, series, movies, and activities tabs
- **THEN** metadata is styled the same way across all of them
- **AND** free-form tags are styled the same way across all of them
