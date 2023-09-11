import React from "react";
import styled from "styled-components";
import SwitchEnvironment from "@appsmith/components/SwitchEnvironment";
import ManualUpgrades from "../../components/BottomBar/ManualUpgrades";
import { Button } from "design-system";
import { DebuggerTrigger } from "../../components/editorComponents/Debugger";
import HelpButton from "../Editor/HelpButton";
import { Layers } from "../../constants/Layers";
import { useSelector } from "react-redux";
import { previewModeSelector } from "../../selectors/editorSelectors";

const Container = styled.div`
  background-color: white;
  grid-column-start: 2;
  grid-column-end: 4;
  border-top-right-radius: 4px;
  border-top-left-radius: 4px;
  z-index: ${Layers.bottomBar};
  display: flex;
  justify-content: space-between;
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DebugBar = () => {
  const isPreviewMode = useSelector(previewModeSelector);
  return (
    <Container>
      <Wrapper>
        <SwitchEnvironment viewMode={isPreviewMode} />
        {/* {!isPreviewMode && <QuickGitActions />} */}
      </Wrapper>
      {!isPreviewMode && (
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
};

export default DebugBar;
