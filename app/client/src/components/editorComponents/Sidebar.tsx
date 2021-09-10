import React, { memo, useEffect } from "react";
import styled from "styled-components";
import ExplorerSidebar from "pages/Editor/Explorer";
import { PanelStack } from "@blueprintjs/core";
import * as Sentry from "@sentry/react";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

const SidebarWrapper = styled.div`
  width: ${(props) => props.theme.sidebarWidth};
`;

const initialPanel = { component: ExplorerSidebar };

export const Sidebar = memo(() => {
  PerformanceTracker.startTracking(PerformanceTransactionName.SIDE_BAR_MOUNT);
  useEffect(() => {
    PerformanceTracker.stopTracking();
  });

  return (
    <SidebarWrapper className="t--sidebar p-0 z-3 overflow-y-auto bg-trueGray-800 text-white">
      <PanelStack
        className="h-full"
        initialPanel={initialPanel}
        showPanelHeader={false}
      />
    </SidebarWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sentry.withProfiler(Sidebar);
