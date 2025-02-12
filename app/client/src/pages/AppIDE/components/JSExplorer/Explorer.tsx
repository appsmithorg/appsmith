import React from "react";
import List from "./JSSegmentList";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";

const JSExplorer = () => {
  const ideViewMode = useSelector(getIDEViewMode);

  if (ideViewMode === EditorViewMode.FullScreen) {
    return <List />;
  }

  return null;
};

export { JSExplorer };
