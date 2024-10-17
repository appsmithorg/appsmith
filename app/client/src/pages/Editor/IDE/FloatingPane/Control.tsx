import React, { useContext } from "react";
import type { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import PropertyControl from "../../PropertyPane/PropertyControl";
import { ControlContext } from "./ControlContext";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

const Control = () => {
  const { selectedControl } = useContext(ControlContext);
  if (!selectedControl) return null;
  return (
    <PropertyControl
      enhancements={undefined}
      isPanelProperty={false}
      isSearchResult={false}
      panel={{
        closePanel: () => {},
        openPanel: () => {},
      }}
      theme={EditorTheme.LIGHT}
      {...(selectedControl as PropertyPaneControlConfig)}
    />
  );
};

export default Control;
