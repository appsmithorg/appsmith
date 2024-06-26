import React from "react";
import { Flex } from "design-system";
import styled from "styled-components";
import type { Composable } from "../Interfaces/Composable";
import type { SidebarButton } from "@appsmith/entities/IDE/constants";
import type { ViewDisplayMode } from "../Interfaces/View";

const Container = styled(Flex)`
  height: calc(100vh - 40px);
  width: 100vw;
`;

const Sidebar = styled.aside`
  width: 50px;
  height: 100%;
  border-right: 1px solid var(--ads-v2-color-border);
  background-color: #2a002b;
`;

const LeftPaneContainer = styled.div`
  height: 100%;
  border-right: 1px solid var(--ads-v2-color-border);
  width: 300px;
`;

const MainPaneContainer = styled.div`
  flex: 1;
  height: 100%;
  transition: all 0.3s ease-in;
`;

const RightPaneContainer = styled.div`
  width: 200px;
  height: 100%;
  border-left: 1px solid var(--ads-v2-color-border);
`;

interface ContainerProps extends Composable {
  sidebarMenu: {
    topButtons: SidebarButton[];
    bottomButtons: SidebarButton[];
    currentSelection: string;
    onClick: (buttonName: string) => void;
  };
}

const Body = ({ children }: ContainerProps) => {
  return (
    <Container>
      <Sidebar />
      {children}
    </Container>
  );
};

interface PropertyControl<T> {
  value: T;
  onValueChange: (value: T) => void;
}

interface LeftPaneProps extends Composable {
  viewMode: ViewDisplayMode;
  // Because of the requirement on drag to resize
  // and the number of size options in the left pane,
  // it is not going to be possible to resize this via states.
  // We need to give explicit control to the consumer
  //
  // When we get width controls, we consider the panel to be of a fixed width.
  // If it is not supplied, we can set the width as per our standards (and based on other panels or their widths)
  // Resize is possible with fixed width
  // If we enable resize for flexible width, we will need to
  widthControls?: PropertyControl<number>;
  resizable: boolean;
  extended: boolean;
}

const LeftPane = ({ children }: LeftPaneProps) => {
  return <LeftPaneContainer>{children}</LeftPaneContainer>;
};

interface MainPaneProps extends Composable {}

const MainPane = ({ children }: MainPaneProps) => {
  return <MainPaneContainer>{children}</MainPaneContainer>;
};

interface RightPaneProps extends Composable {
  viewMode: ViewDisplayMode;
  widthControls?: PropertyControl<number>;
}

const RightPane = ({ children }: RightPaneProps) => {
  return <RightPaneContainer>{children}</RightPaneContainer>;
};

Body.LeftPane = LeftPane;
Body.MainPane = MainPane;
Body.RightPane = RightPane;

// Does not seem like a good option

// enum PanelState {
//   SideBySide = "SideBySide", // Shows panes next to each other
//   MainExtended = "MainExtended", // MainPane takes more space. Left and Right pane in compact state
//   LeftFocus = "LeftFocus", // LeftPane extends out to cover the IDE
//   MainFocus = "MainFocus", // MainPane extends out to cover the IDE (also sidebar)
// }
//
// const PanelConfig = {
//   [PanelState.SideBySide]: {
//     LeftPane: 5,
//     MainPane: 6,
//     RightPane: 1,
//   },
//   [PanelState.MainExtended]: {
//     LeftPane: 2,
//     MainPane: 8,
//     RightPane: 2,
//   },
//   [PanelState.LeftFocus]: {
//     LeftPane: 12,
//     MainPane: 0,
//     RightPane: 0,
//   },
//   [PanelState.MainFocus]: {
//     LeftPane: 0,
//     MainPane: 12,
//     RightPane: 0,
//   },
// };

export default Body;
