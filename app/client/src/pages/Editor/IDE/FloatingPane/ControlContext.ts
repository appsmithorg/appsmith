import React from "react";
import type { PropertyPaneControlConfig } from "constants/PropertyControlConstants";

export const ControlContext = React.createContext<{
  selectedControl: undefined | PropertyPaneControlConfig;
  setSelectedControl:
    | undefined
    | ((control: PropertyPaneControlConfig) => void);
}>({
  selectedControl: undefined,
  setSelectedControl: undefined,
});
