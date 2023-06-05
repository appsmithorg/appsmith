import React, { useEffect } from "react";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { SegmentedControl } from "design-system";
import { tailwindLayers } from "constants/Layers";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useRouteMatch } from "react-router";
import { Route, Switch } from "react-router-dom";
import type { AppState } from "@appsmith/reducers";
import { builderURL } from "RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { trimQueryString } from "utils/helpers";
import history from "utils/history";
import WidgetSidebar from "../WidgetSidebar";
import EntityExplorer from "./CanvasCodeEntityExplorer";
import { getExplorerSwitchIndex } from "selectors/editorContextSelectors";
import { setExplorerSwitchIndex } from "actions/editorContextActions";
import {
  API_EDITOR_ID_PATH,
  BUILDER_CHECKLIST_PATH,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  CURL_IMPORT_PAGE_PATH,
  GENERATE_TEMPLATE_FORM_PATH,
  INTEGRATION_EDITOR_PATH,
  JS_COLLECTION_EDITOR_PATH,
  JS_COLLECTION_ID_PATH,
  PROVIDER_TEMPLATE_PATH,
  QUERIES_EDITOR_ID_PATH,
  WIDGETS_EDITOR_BASE_PATH,
  WIDGETS_EDITOR_ID_PATH,
} from "constants/routes";
import { SaaSEditorRoutes } from "../SaaSEditor/routes";
import { DatasourceEditorRoutes } from "@appsmith/pages/routes";

export const CANVAS_ROUTES = [
  {
    key: "BUILDER_PATH_DEPRECATED",
    path: BUILDER_PATH_DEPRECATED,
  },
  {
    key: "BUILDER_PATH",
    path: BUILDER_PATH,
  },
  {
    key: "BUILDER_CUSTOM_PATH",
    path: BUILDER_CUSTOM_PATH,
  },
  {
    key: "WIDGETS_EDITOR_BASE_PATH",
    path: WIDGETS_EDITOR_BASE_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "WIDGETS_EDITOR_ID_PATH",
    path: WIDGETS_EDITOR_ID_PATH,
    prefixCurrentPath: true,
  },
];

const SaaSEditorPaths = SaaSEditorRoutes.map((route, index) => {
  return {
    key: `SaaSEditorPaths${index}`,
    path: route.path,
    prefixCurrentPath: true,
  };
});
const DatasourceEditorPaths = DatasourceEditorRoutes.map((route, index) => {
  return {
    key: `DatasourceEditorPaths${index}`,
    path: route.path,
    prefixCurrentPath: true,
  };
});
export const QUERIES_JS_ROUTES = [
  {
    key: "INTEGRATION_EDITOR_PATH",
    path: INTEGRATION_EDITOR_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "BUILDER_CHECKLIST_PATH",
    path: BUILDER_CHECKLIST_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "API_EDITOR_ID_PATH",
    path: API_EDITOR_ID_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "QUERIES_EDITOR_ID_PATH",
    path: QUERIES_EDITOR_ID_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "JS_COLLECTION_EDITOR_PATH",
    path: JS_COLLECTION_EDITOR_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "JS_COLLECTION_ID_PATH",
    path: JS_COLLECTION_ID_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "CURL_IMPORT_PAGE_PATH",
    path: CURL_IMPORT_PAGE_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "PROVIDER_TEMPLATE_PATH",
    path: PROVIDER_TEMPLATE_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "GENERATE_TEMPLATE_FORM_PATH",
    path: GENERATE_TEMPLATE_FORM_PATH,
    prefixCurrentPath: true,
  },
  {
    key: "BLANK_PAGE",
    path: "/blank",
    prefixCurrentPath: true,
  },
  ...SaaSEditorPaths,
  ...DatasourceEditorPaths,
];

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
  const { path } = useRouteMatch();
  const dispatch = useDispatch();
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const pageId = useSelector(getCurrentPageId);
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
      if (!(trimQueryString(builderURL({ pageId })) === location.pathname)) {
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
    }
  };
  const { value: activeOption } = options[activeSwitchIndex];

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden ${tailwindLayers.entityExplorer}`}
    >
      <Switch>
        {CANVAS_ROUTES.map((route) => {
          let routepath = route.prefixCurrentPath ? path : "";
          routepath += route.path;
          return (
            <Route
              exact
              key={route.key}
              path={routepath}
              render={() => {
                return (
                  <>
                    <div className={`flex-shrink-0 px-2 mt-1 py-2 border-t`}>
                      <SegmentedControl
                        onChange={onChange}
                        options={options}
                        value={activeOption}
                      />
                    </div>
                    <WidgetSidebar isActive={activeOption === "widgets"} />
                    <EntityExplorer isActive={activeOption === "explorer"} />
                  </>
                );
              }}
            />
          );
        })}
        <Route
          render={() => {
            return <EntityExplorer isActive />;
          }}
        />
      </Switch>
    </div>
  );
}

export default ExplorerContent;
