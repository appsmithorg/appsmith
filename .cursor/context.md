# GenSmith System Context

GenSmith is an AI-driven development platform built on top of Appsmith.

## Core Architecture

- The UI is fully driven by a DSL (JSON structure)
- The DSL is the single source of truth for UI rendering
- The Canvas renders UI based on the DSL
- Redux store maintains the DSL state

## Key Concepts

- Widget: a UI component defined in the DSL
- widgetId: unique identifier for each widget (UUID)
- type: determines how the widget is rendered

## Data Flow

- User action or AI generates DSL changes
- DSL changes are applied to Redux store
- Redux updates trigger UI re-render
- UI interactions must sync back to DSL

## System Principles

- DSL and UI must always stay in sync (bidirectional consistency)
- AI-generated DSL must be validated before applying
- The system relies heavily on Redux-Saga side effects
- Many features depend on existing Appsmith architecture assumptions

## Development Philosophy

- Prefer extending existing Appsmith patterns over introducing new ones
- Maintain compatibility with Appsmith backend when possible
- Avoid breaking implicit dependencies in Redux and Saga flows
