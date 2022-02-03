import { IPanelProps } from "@blueprintjs/core";
import React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import WidgetSidebar from "../WidgetSidebar";
import EntityExplorer from "./EntityExplorer";

const isForceOpenWidgetPanelSelector = (state: AppState) =>
  state.ui.onBoarding.forceOpenWidgetPanel;

function ExplorerContent(props: IPanelProps) {
  const isForceOpenWidgetPanel = useSelector(isForceOpenWidgetPanelSelector);
  useEffect(() => {
    if (isForceOpenWidgetPanel) {
      props.openPanel({ component: WidgetSidebar });
    }
  }, [isForceOpenWidgetPanel]);

  return <EntityExplorer {...props} />;
}

export default ExplorerContent;
