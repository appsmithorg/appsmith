import React, { useEffect } from "react";

import { setExplorerSwitchIndex } from "actions/editorContextActions";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { builderURL } from "ee/RouteBuilder";
import type { AppState } from "ee/reducers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { getExplorerSwitchIndex } from "selectors/editorContextSelectors";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { trimQueryString } from "utils/helpers";
import history from "utils/history";

import { SegmentedControl } from "@appsmith/ads";

import UIEntitySidebar from "../widgetSidebar/UIEntitySidebar";
import { ExplorerWrapper } from "./Common/ExplorerWrapper";
import EntityExplorer from "./EntityExplorer";

const selectForceOpenWidgetPanel = (state: AppState) =>
  state.ui.onBoarding.forceOpenWidgetPanel;

const options = [
  {
    value: "explorer",
    label: "Explorer",
  },
  {
    value: "widgets",
    label: "Widgets",
  },
];

function ExplorerContent() {
  const dispatch = useDispatch();
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const basePageId = useSelector(getCurrentBasePageId);
  const location = useLocation();
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

  const onChange = (value: string) => {
    if (value === options[0].value) {
      dispatch(forceOpenWidgetPanel(false));
    } else if (value === options[1].value) {
      if (
        !(trimQueryString(builderURL({ basePageId })) === location.pathname)
      ) {
        history.push(builderURL({ basePageId }));
        AnalyticsUtil.logEvent("WIDGET_TAB_CLICK", {
          type: "WIDGET_TAB",
          fromUrl: location.pathname,
          toUrl: builderURL({ basePageId }),
        });
      }

      AnalyticsUtil.logEvent("EXPLORER_WIDGET_CLICK");
      dispatch(forceOpenWidgetPanel(true));
      dispatch(setExplorerSwitchIndex(1));
      if (isFirstTimeUserOnboardingEnabled) {
        dispatch(toggleInOnboardingWidgetSelection(true));
      }
    }
  };
  const { value: activeOption } = options[activeSwitchIndex];

  return (
    <ExplorerWrapper>
      <div
        className="flex-shrink-0 p-3 pb-2"
        data-testid="explorer-tab-options"
        id="explorer-tab-options"
      >
        <SegmentedControl
          onChange={onChange}
          options={options}
          value={activeOption}
        />
      </div>

      <UIEntitySidebar isActive={activeOption === "widgets"} />

      <EntityExplorer isActive={activeOption === "explorer"} />
    </ExplorerWrapper>
  );
}

export default ExplorerContent;
