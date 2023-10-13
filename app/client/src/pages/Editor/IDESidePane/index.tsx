import React from "react";
import WidgetsEditorEntityExplorer from "../WidgetsEditorEntityExplorer";
import { getCurrentAppState } from "entities/IDE/utils";
import { useSelector } from "react-redux";
import { getIsAppSidebarEnabled } from "selectors/ideSelectors";
import { AppState } from "entities/IDE/constants";
import styled from "styled-components";

const SidePaneContainer = styled.div`
  height: 100%;
  width: 250px;
  border-right: 1px solid var(--ads-v2-color-border);
`;

const IDESidePane = () => {
  const isAppSidebarEnabled = useSelector(getIsAppSidebarEnabled);
  const appState = getCurrentAppState(window.location.pathname);
  if (!isAppSidebarEnabled) {
    return <WidgetsEditorEntityExplorer />;
  }
  if (appState === AppState.PAGES) {
    return <WidgetsEditorEntityExplorer />;
  }
  return <SidePaneContainer />;
};

export default IDESidePane;
