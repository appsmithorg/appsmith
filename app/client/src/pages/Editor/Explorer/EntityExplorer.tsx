import React, { useRef, useCallback, useEffect } from "react";
import styled from "styled-components";
import { NonIdealState, Classes } from "@blueprintjs/core";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { useDispatch, useSelector } from "react-redux";

import { Colors } from "constants/Colors";

import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";

import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import Files from "./Files";
import ExplorerWidgetGroup from "./Widgets/WidgetGroup";
import { builderURL } from "@appsmith/RouteBuilder";
import history from "utils/history";
import {
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/selectedWorkspaceSelectors";
import { importSvg } from "design-system-old";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { EntityExplorerWrapper } from "./Common/EntityExplorerWrapper";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { FilesContextProvider } from "./Files/FilesContextProvider";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
import { getShowWorkflowFeature } from "@appsmith/selectors/workflowSelectors";

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

  const applicationId = useSelector(getCurrentApplicationId);

  const pagePermissions = useSelector(getPagePermissions);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const showWorkflows = useSelector(getShowWorkflowFeature);

  return (
    <EntityExplorerWrapper explorerRef={explorerRef} isActive={isActive}>
      <ExplorerWidgetGroup
        addWidgetsFn={showWidgetsSidebar}
        searchKeyword=""
        step={0}
      />
      <FilesContextProvider
        canCreateActions={canCreateActions}
        editorId={applicationId}
        parentEntityId={pageId}
        parentEntityType={ActionParentEntityType.PAGE}
        showWorkflows={showWorkflows}
      >
        <Files />
      </FilesContextProvider>
      {noResults && (
        <NoResult
          className={Classes.DARK}
          description="Try modifying the search keyword."
          icon={<NoEntityFoundSvg />}
          title="No entities found"
        />
      )}
    </EntityExplorerWrapper>
  );
}

EntityExplorer.displayName = "EntityExplorer";

export default EntityExplorer;
