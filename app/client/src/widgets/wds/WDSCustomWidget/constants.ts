// This file contains common constants which can be used across the widget configuration file (index.ts), widget and component folders.
export const DEFAULT_MODEL = `{
  "tips": [
    "Pass data to this widget in the default model field",
    "Access data in the javascript file using the appsmith.model variable",
    "Create events in the widget and trigger them in the javascript file using appsmith.triggerEvent('eventName')",
    "Access data in CSS as var(--appsmith-model-{property-name})"
  ]
}`;

export const COMPONENT_SIZE = {
  AUTO: "AUTO",
  FIT_PAGE: "FIT_PAGE",
} as const;
