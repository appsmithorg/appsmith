import React from "react";
import List from "./List";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";

const JSExplorer = () => {
  const ideViewMode = useSelector(getIDEViewMode);

  if (ideViewMode === EditorViewMode.FullScreen) {
    return <List />;
  }

  return null;
};

export { JSExplorer };
