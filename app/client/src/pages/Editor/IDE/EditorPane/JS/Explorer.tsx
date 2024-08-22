import React from "react";

import { EditorViewMode } from "ee/entities/IDE/constants";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";

import List from "./List";

const JSExplorer = () => {
  const ideViewMode = useSelector(getIDEViewMode);
  if (ideViewMode === EditorViewMode.FullScreen) {
    return <List />;
  }
  return null;
};

export { JSExplorer };
