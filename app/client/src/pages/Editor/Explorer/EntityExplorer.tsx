import React, { useRef, useCallback, useEffect } from "react";
import styled from "styled-components";
import { NonIdealState, Classes } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";

import { Colors } from "constants/Colors";

import { getIsFirstTimeUserOnboardingEnabled } from "selectors/onboardingSelectors";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";

import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import Files from "./Files";
import ExplorerWidgetGroup from "./Widgets/WidgetGroup";
import { builderURL } from "ee/RouteBuilder";
import history from "utils/history";
import {
  getCurrentBasePageId,
  getCurrentPageId,
  getPagePermissions,
} from "selectors/editorSelectors";
import { fetchWorkspace } from "ee/actions/workspaceActions";
import { getCurrentWorkspaceId } from "ee/selectors/selectedWorkspaceSelectors";
import { importSvg } from "@appsmith/ads-old";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { EntityExplorerWrapper } from "./Common/EntityExplorerWrapper";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { FilesContextProvider } from "./Files/FilesContextProvider";
import { getHasCreateActionPermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { ActionParentEntityType } from "ee/entities/Engine/actionHelpers";
import { getShowWorkflowFeature } from "ee/selectors/workflowSelectors";

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
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const noResults = false;
  const basePageId = useSelector(getCurrentBasePageId);
  const pageId = useSelector(getCurrentPageId);
  const showWidgetsSidebar = useCallback(() => {
    AnalyticsUtil.logEvent("EXPLORER_WIDGET_CLICK");
    history.push(builderURL({ basePageId }));
    dispatch(forceOpenWidgetPanel(true));
    if (isFirstTimeUserOnboardingEnabled) {
      dispatch(toggleInOnboardingWidgetSelection(true));
    }
  }, [isFirstTimeUserOnboardingEnabled, basePageId]);

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
