import React from "react";
import styled from "styled-components";
import QuickGitActions from "pages/Editor/gitSync/QuickGitActions";
import { Layers } from "constants/Layers";
import { DebuggerTrigger } from "components/editorComponents/Debugger";
import { Colors } from "constants/Colors";
import HelpButton from "pages/Editor/HelpButton";
import ManualUpgrades from "./ManualUpgrades";
import { Icon, IconSize } from "design-system";

const Container = styled.div`
  width: 100%;
  height: ${(props) => props.theme.bottomBarHeight};
  display: flex;
  position: fixed;
  justify-content: space-between;
  background-color: ${(props) => props.theme.colors.editorBottomBar.background};
  z-index: ${Layers.bottomBar};
  border-top: solid 1px ${Colors.MERCURY};
  padding: 0 ${(props) => props.theme.spaces[11]}px;
`;

export default function BottomBar(props: { className?: string }) {
  return (
    <Container className={props.className ?? ""}>
      <QuickGitActions />
      <div className="flex justify-between items-center gap-1">
        <ManualUpgrades showTooltip>
          <Icon
            className="t--upgrade"
            fillColor={Colors.SCORPION}
            name="upgrade"
            size={IconSize.XXXL}
          />
        </ManualUpgrades>
        <HelpButton />
        <DebuggerTrigger />
      </div>
    </Container>
  );
}
