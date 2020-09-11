import React, { memo } from "react";
import styled from "styled-components";
import ExplorerSidebar from "pages/Editor/Explorer";
import { PanelStack, Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

const SidebarWrapper = styled.div`
  background-color: ${Colors.MINE_SHAFT};
  padding: 0px 0 0 6px;
  width: ${props => props.theme.sidebarWidth};
  z-index: 3;

  color: ${props => props.theme.colors.textOnDarkBG};
  overflow-y: auto;
  & .${Classes.PANEL_STACK} {
    height: 100%;
    .${Classes.PANEL_STACK_VIEW} {
      background: none;
    }
  }
`;

const initialPanel = { component: ExplorerSidebar };

export const Sidebar = memo(() => {
  return (
    <SidebarWrapper className="t--sidebar">
      <PanelStack initialPanel={initialPanel} showPanelHeader={false} />
    </SidebarWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
