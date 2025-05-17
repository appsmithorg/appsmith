# Kanban Widget for Appsmith

This package provides a customizable Kanban board widget that can be used inside Appsmith as a custom widget.

## Features
- Dynamic columns and tasks driven by props
- Drag and drop support (powered by `react-beautiful-dnd`)
- Inline task creation and deletion
- Style customization via props

## Installation

```
yarn add @appsmith/kanban-widget
```

## Usage

```
import KanbanWidget from '@appsmith/kanban-widget';
```

Render the widget in your custom widget container and pass the required props.

See `src/types.ts` for available prop definitions.
