import React, { useContext, useEffect } from "react";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { SegmentedControl } from "design-system";
import { tailwindLayers } from "constants/Layers";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import type { AppState } from "@appsmith/reducers";
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
import {
  adaptiveSignpostingEnabled,
  selectFeatureFlags,
} from "@appsmith/selectors/featureFlagsSelectors";
import WidgetSidebarWithTags from "../WidgetSidebarWithTags";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import {
  getFeatureWalkthroughShown,
  setFeatureWalkthroughShown,
} from "utils/storage";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import {
  actionsExistInCurrentPage,
  widgetsExistCurrentPage,
} from "selectors/entitiesSelector";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

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
  const pageId = useSelector(getCurrentPageId);
  const location = useLocation();
  const activeSwitchIndex = useSelector(getExplorerSwitchIndex);
  const featureFlags = useSelector(selectFeatureFlags);

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
      if (!(trimQueryString(builderURL({ pageId })) === location.pathname)) {
        history.push(builderURL({ pageId }));
        AnalyticsUtil.logEvent("WIDGET_TAB_CLICK", {
          type: "WIDGET_TAB",
          fromUrl: location.pathname,
          toUrl: builderURL({ pageId }),
        });
      }

      AnalyticsUtil.logEvent("EXPLORER_WIDGET_CLICK");
      dispatch(forceOpenWidgetPanel(true));
      dispatch(setExplorerSwitchIndex(1));
      if (isFirstTimeUserOnboardingEnabled) {
        dispatch(toggleInOnboardingWidgetSelection(true));
      }
    }

    handleCloseWalkthrough();
  };
  const { value: activeOption } = options[activeSwitchIndex];

  const {
    isOpened: isWalkthroughOpened,
    popFeature,
    pushFeature,
  } = useContext(WalkthroughContext) || {};
  const handleCloseWalkthrough = () => {
    if (isWalkthroughOpened && popFeature) {
      popFeature();
    }
  };
  const signpostingEnabled = useSelector(getIsFirstTimeUserOnboardingEnabled);
  const adaptiveSignposting = useSelector(adaptiveSignpostingEnabled);
  const hasWidgets = useSelector(widgetsExistCurrentPage);
  const actionsExist = useSelector(actionsExistInCurrentPage);
  const checkAndShowSwitchWidgetWalkthrough = async () => {
    const isFeatureWalkthroughShown = await getFeatureWalkthroughShown(
      FEATURE_WALKTHROUGH_KEYS.switch_to_widget,
    );
    !isFeatureWalkthroughShown &&
      pushFeature &&
      pushFeature({
        targetId: `#explorer-tab-options [data-value*="widgets"]`,
        details: {
          title: "Switch to Widgets section",
          description:
            "Segmented View in Entity Explorer enables swift switching between Explorer and Widgets. Select Widgets tab, then click on a widget to bind data",
          imageURL: `${ASSETS_CDN_URL}/switch-to-widget.gif`,
        },
        onDismiss: async () => {
          await setFeatureWalkthroughShown(
            FEATURE_WALKTHROUGH_KEYS.switch_to_widget,
            true,
          );
        },
        offset: {
          position: "right",
          highlightPad: 5,
          indicatorLeft: -3,
          style: {
            transform: "none",
            boxShadow: "var(--ads-v2-shadow-popovers)",
            border: "1px solid var(--ads-v2-color-border-muted)",
          },
        },
        dismissOnOverlayClick: true,
        overlayColor: "transparent",
        delay: 1000,
      });
  };

  useEffect(() => {
    if (
      activeSwitchIndex === 0 &&
      signpostingEnabled &&
      !hasWidgets &&
      adaptiveSignposting &&
      actionsExist
    ) {
      checkAndShowSwitchWidgetWalkthrough();
    }
  }, [
    activeSwitchIndex,
    signpostingEnabled,
    hasWidgets,
    adaptiveSignposting,
    actionsExist,
  ]);

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden ${tailwindLayers.entityExplorer}`}
    >
      <div
        className="flex-shrink-0 p-3 pb-2 mt-1 border-t"
        data-testid="explorer-tab-options"
        id="explorer-tab-options"
      >
        <SegmentedControl
          onChange={onChange}
          options={options}
          value={activeOption}
        />
      </div>

      {featureFlags.release_widgetdiscovery_enabled ? (
        <WidgetSidebarWithTags isActive={activeOption === "widgets"} />
      ) : (
        <WidgetSidebar isActive={activeOption === "widgets"} />
      )}

      <EntityExplorer isActive={activeOption === "explorer"} />
    </div>
  );
}

export default ExplorerContent;
