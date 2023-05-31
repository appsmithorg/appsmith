import React, { useRef, useCallback, useEffect } from "react";
import styled from "styled-components";
import { Route, Switch, useRouteMatch } from "react-router";
import { NonIdealState, Classes } from "@blueprintjs/core";
import JSDependencies from "./Libraries";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useDispatch, useSelector } from "react-redux";

import { Colors } from "constants/Colors";

import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";

import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import Datasources from "./Datasources";
import Files from "./Files";
import ExplorerWidgetGroup from "./Widgets/WidgetGroup";
import { builderURL } from "RouteBuilder";
import history from "utils/history";
import { getCurrentPageId } from "selectors/editorSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { importSvg } from "design-system-old";
import { CANVAS_ROUTES, QUERIES_JS_ROUTES } from "./CanvasCodeExplorer";

const NoEntityFoundSvg = importSvg(
  () => import("assets/svg/no_entities_found.svg"),
);

const Wrapper = styled.div`
  height: 100%;
  overflow-y: auto;
  -ms-overflow-style: none;
`;

const NoResult = styled(NonIdealState)`
  &.${Classes.NON_IDEAL_STATE} {
    height: auto;
    margin: 20px 0;

    .${Classes.NON_IDEAL_STATE_VISUAL} {
      margin-bottom: 16px;
      height: 52px;

      svg {
        height: 52px;
        width: 144px;
      }
    }

    div {
      color: ${Colors.DOVE_GRAY2};
    }

    .${Classes.HEADING} {
      margin-bottom: 4px;
      color: ${(props) => props.theme.colors.textOnWhiteBG};
    }
  }
`;

function EntityExplorer({ isActive }: { isActive: boolean }) {
  const dispatch = useDispatch();
  const { path } = useRouteMatch();
  PerformanceTracker.startTracking(PerformanceTransactionName.ENTITY_EXPLORER);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const noResults = false;
  const pageId = useSelector(getCurrentPageId);
  const showWidgetsSidebar = useCallback(() => {
    history.push(builderURL({ pageId }));
    dispatch(forceOpenWidgetPanel(true));
    if (isFirstTimeUserOnboardingEnabled) {
      dispatch(toggleInOnboardingWidgetSelection(true));
    }
  }, [isFirstTimeUserOnboardingEnabled, pageId]);

  const currentWorkspaceId = useSelector(getCurrentWorkspaceId);

  useEffect(() => {
    dispatch(fetchWorkspace(currentWorkspaceId));
  }, [currentWorkspaceId]);

  return (
    <Wrapper
      className={`t--entity-explorer-wrapper relative overflow-y-auto ${
        isActive ? "" : "hidden"
      }`}
      ref={explorerRef}
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
                  <ExplorerWidgetGroup
                    addWidgetsFn={showWidgetsSidebar}
                    searchKeyword=""
                    step={0}
                  />
                );
              }}
            />
          );
        })}
        {QUERIES_JS_ROUTES.map((route) => {
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
                    <Files />
                    {noResults && (
                      <NoResult
                        className={Classes.DARK}
                        description="Try modifying the search keyword."
                        icon={<NoEntityFoundSvg />}
                        title="No entities found"
                      />
                    )}
                  </>
                );
              }}
            />
          );
        })}
      </Switch>
      <Datasources />
      <JSDependencies />
    </Wrapper>
  );
}

EntityExplorer.displayName = "EntityExplorer";

export default EntityExplorer;
