import React from "react";
import { Container, Wrapper } from "components/BottomBar/components";
import { DebuggerTrigger } from "components/editorComponents/Debugger";

export default function BottomBar() {
  return (
    <Container>
      <Wrapper>
        <div data-testid="t--switch-env" />
      </Wrapper>
      <Wrapper>
        <DebuggerTrigger />
        <div data-testid="t--help-button" />
      </Wrapper>
    </Container>
  );
}
