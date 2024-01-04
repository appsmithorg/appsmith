import React from "react";
import { Container, Wrapper } from "components/BottomBar/components";
import { DebuggerTrigger } from "components/editorComponents/Debugger";
import SwitchEnvironment from "@appsmith/components/SwitchEnvironment";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";
import { useSelector } from "react-redux";

export default function BottomBar() {
  const packageId = useSelector(getCurrentPackageId) || "";
  return (
    <Container>
      <Wrapper>
        <SwitchEnvironment editorId={packageId} viewMode={false} />
      </Wrapper>
      <Wrapper>
        <DebuggerTrigger />
        <div data-testid="t--help-button" />
      </Wrapper>
    </Container>
  );
}
