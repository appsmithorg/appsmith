import React, { useRef, useCallback, useEffect, useContext } from "react";
import styled from "styled-components";
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
import { builderURL } from "@appsmith/RouteBuilder";
import history from "utils/history";
import { getCurrentPageId } from "selectors/editorSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { importSvg } from "design-system-old";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { EntityExplorerWrapper } from "./Common/EntityExplorerWrapper";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { INTEGRATION_TABS } from "constants/routes";
import {
  getExplorerStatus,
  saveExplorerStatus,
} from "@appsmith/pages/Editor/Explorer/helpers";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import DatasourceStarterLayoutPrompt from "./Datasources/DatasourceStarterLayoutPrompt";
import { useIsAppSidebarEnabled } from "../../../navigation/featureFlagHooks";

const NoEntityFoundSvg = importSvg(
  async () => import("assets/svg/no_entities_found.svg"),
);

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
    AnalyticsUtil.logEvent("EXPLORER_WIDGET_CLICK");
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

  const { isOpened: isWalkthroughOpened, popFeature } =
    useContext(WalkthroughContext) || {};
  const applicationId = useSelector(getCurrentApplicationId);
  const isDatasourcesOpen = getExplorerStatus(applicationId, "datasource");
  const isAppSidebarEnabled = useIsAppSidebarEnabled();

  const closeWalkthrough = useCallback(() => {
    if (isWalkthroughOpened && popFeature) {
      popFeature("EXPLORER_DATASOURCE_ADD");
    }
  }, [isWalkthroughOpened, popFeature]);

  const addDatasource = useCallback(
    (entryPoint: string) => {
      history.push(
        integrationEditorURL({
          pageId,
          selectedTab: INTEGRATION_TABS.NEW,
        }),
      );
      // Event for datasource creation click
      AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
        entryPoint,
      });
      closeWalkthrough();
    },
    [pageId, closeWalkthrough],
  );

  const listDatasource = useCallback(() => {
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab: INTEGRATION_TABS.ACTIVE,
      }),
    );
  }, [pageId]);

  const onDatasourcesToggle = useCallback(
    (isOpen: boolean) => {
      saveExplorerStatus(applicationId, "datasource", isOpen);
    },
    [applicationId],
  );

  return (
    <EntityExplorerWrapper explorerRef={explorerRef} isActive={isActive}>
      <ExplorerWidgetGroup
        addWidgetsFn={showWidgetsSidebar}
        searchKeyword=""
        step={0}
      />
      <Files />
      {noResults && (
        <NoResult
          className={Classes.DARK}
          description="Try modifying the search keyword."
          icon={<NoEntityFoundSvg />}
          title="No entities found"
        />
      )}
      {/* Shows first time users only */}
      <DatasourceStarterLayoutPrompt />
      {!isAppSidebarEnabled && (
        <>
          <Datasources
            addDatasource={addDatasource}
            entityId={pageId}
            isDatasourcesOpen={isDatasourcesOpen}
            listDatasource={listDatasource}
            onDatasourcesToggle={onDatasourcesToggle}
          />
          <JSDependencies />
        </>
      )}
    </EntityExplorerWrapper>
  );
}

EntityExplorer.displayName = "EntityExplorer";

export default EntityExplorer;
