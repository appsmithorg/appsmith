import { tailwindLayers } from "constants/Layers";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import EntityExplorer from "./EntityExplorer";
import { getExplorerSwitchIndex } from "selectors/editorContextSelectors";
import { setExplorerSwitchIndex } from "actions/editorContextActions";

export const selectForceOpenWidgetPanel = (state: AppState) =>
  state.ui.onBoarding.forceOpenWidgetPanel;

function ExplorerContent() {
  const dispatch = useDispatch();
  const activeSwitchIndex = useSelector(getExplorerSwitchIndex);

  const setActiveSwitchIndex = (index: number) => {
    dispatch(setExplorerSwitchIndex(index));
  };
  const openWidgetPanel = useSelector(selectForceOpenWidgetPanel);

  useEffect(() => {
    const currentIndex = openWidgetPanel ? 1 : 0;
    if (currentIndex !== activeSwitchIndex) {
      setActiveSwitchIndex(currentIndex);
    }
  }, [openWidgetPanel]);

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden ${tailwindLayers.entityExplorer}`}
    >
      <EntityExplorer isActive />
    </div>
  );
}

export default ExplorerContent;
