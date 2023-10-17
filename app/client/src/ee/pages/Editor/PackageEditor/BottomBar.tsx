import React from "react";
import { DebuggerTrigger } from "components/editorComponents/Debugger";
import HelpButton from "pages/Editor/HelpButton";
import ManualUpgrades from "components/BottomBar/ManualUpgrades";
import { Button } from "design-system";
import SwitchEnvironment from "@appsmith/components/SwitchEnvironment";
import { Container, Wrapper } from "components/BottomBar/components";

export default function BottomBar() {
  return (
    <Container>
      <Wrapper>
        <SwitchEnvironment />
      </Wrapper>
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
    </Container>
  );
}
