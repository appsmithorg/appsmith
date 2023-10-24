import React from "react";
import PropertyPaneWrapper from "pages/Editor/WidgetsEditor/PropertyPaneWrapper";
import useCurrentAppState from "../hooks";
import { AppState } from "entities/IDE/constants";

const RightPane = () => {
  const appState = useCurrentAppState();
  if (appState === AppState.PAGES) {
    return <PropertyPaneWrapper />;
  }
  return null;
};

export default RightPane;
