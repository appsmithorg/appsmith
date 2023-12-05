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
import { getCurrentPageId } from "selectors/editorSelectors";
import { fetchWorkspace } from "@appsmith/actions/workspaceActions";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import { importSvg } from "design-system-old";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { EntityExplorerWrapper } from "./Common/EntityExplorerWrapper";
import DatasourceStarterLayoutPrompt from "./Datasources/DatasourceStarterLayoutPrompt";

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
    </EntityExplorerWrapper>
  );
}

EntityExplorer.displayName = "EntityExplorer";

export default EntityExplorer;
