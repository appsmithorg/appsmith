import React from "react";
import styled from "styled-components";
import QuickGitActions from "pages/Editor/gitSync/QuickGitActions";
import { Layers } from "constants/Layers";
import { DebuggerTrigger } from "components/editorComponents/Debugger";
import HelpButton from "pages/Editor/HelpButton";
import ManualUpgrades from "./ManualUpgrades";
import { Button } from "design-system";
import SwitchEnvironment from "@appsmith/components/SwitchEnvironment";

const Container = styled.div`
  width: 100%;
  height: ${(props) => props.theme.bottomBarHeight};
  display: flex;
  position: fixed;
  justify-content: space-between;
  background-color: ${(props) => props.theme.colors.editorBottomBar.background};
  z-index: ${Layers.bottomBar};
  border-top: solid 1px var(--ads-v2-color-border);
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export default function BottomBar({ viewMode }: { viewMode: boolean }) {
  return (
    <Container>
      <Wrapper>
        <SwitchEnvironment viewMode={viewMode} />
        {!viewMode && <QuickGitActions />}
      </Wrapper>
      {!viewMode && (
        <Wrapper>
          <ManualUpgrades showTooltip>
            <Button
              className="t--upgrade"
              isIconButton
              kind="tertiary"
              size="md"
              startIcon="upgrade"
            />
          </ManualUpgrades>
          <DebuggerTrigger />
          <HelpButton />
        </Wrapper>
      )}
    </Container>
  );
}
