import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { Switcher } from "design-system";
import { Colors } from "constants/Colors";
import { tailwindLayers } from "constants/Layers";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { AppState } from "@appsmith/reducers";
import { builderURL } from "RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { trimQueryString } from "utils/helpers";
import history from "utils/history";
import WidgetSidebar from "../WidgetSidebar";
import EntityExplorer from "./EntityExplorer";
import { getExplorerSwitchIndex } from "selectors/editorContextSelectors";
import { setExplorerSwitchIndex } from "actions/editorContextActions";

const selectForceOpenWidgetPanel = (state: AppState) =>
  state.ui.onBoarding.forceOpenWidgetPanel;

function ExplorerContent() {
  const dispatch = useDispatch();
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const pageId = useSelector(getCurrentPageId);
  const location = useLocation();
  const switches = useMemo(
    () => [
      {
        id: "explorer",
        text: "Explorer",
        action: () => dispatch(forceOpenWidgetPanel(false)),
      },
      {
        id: "widgets",
        text: "Widgets",
        action: () => {
          if (
            !(trimQueryString(builderURL({ pageId })) === location.pathname)
          ) {
            history.push(builderURL({ pageId }));
            AnalyticsUtil.logEvent("WIDGET_TAB_CLICK", {
              type: "WIDGET_TAB",
              fromUrl: location.pathname,
              toUrl: builderURL({ pageId }),
            });
          }
          dispatch(forceOpenWidgetPanel(true));
          dispatch(setExplorerSwitchIndex(1));
          if (isFirstTimeUserOnboardingEnabled) {
            dispatch(toggleInOnboardingWidgetSelection(true));
          }
        },
      },
    ],
    [
      dispatch,
      forceOpenWidgetPanel,
      isFirstTimeUserOnboardingEnabled,
      toggleInOnboardingWidgetSelection,
      location.pathname,
      pageId,
    ],
  );
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
      <div
        className={`flex-shrink-0 px-3 mt-1 py-2 border-t border-b border-[${Colors.Gallery}]`}
      >
        <Switcher activeObj={switches[activeSwitchIndex]} switches={switches} />
      </div>
      <WidgetSidebar isActive={switches[activeSwitchIndex].id === "widgets"} />
      <EntityExplorer
        isActive={switches[activeSwitchIndex].id === "explorer"}
      />
    </div>
  );
}

export default ExplorerContent;
