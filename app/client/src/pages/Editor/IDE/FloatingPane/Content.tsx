import React, { useState } from "react";
import Toolbar from "./Toolbar";
import type { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import { ControlContext } from "./ControlContext";
import Control from "./Control";

const Content = () => {
  const [selectedControl, setSelectedControl] = useState<
    PropertyPaneControlConfig | undefined
  >();

  return (
    <ControlContext.Provider value={{ selectedControl, setSelectedControl }}>
      <Toolbar />
      <Control />
    </ControlContext.Provider>
  );
};

export default Content;
