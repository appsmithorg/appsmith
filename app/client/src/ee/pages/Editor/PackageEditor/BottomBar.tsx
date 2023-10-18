import React from "react";
import { Container, Wrapper } from "components/BottomBar/components";

export default function BottomBar() {
  return (
    <Container>
      <Wrapper>
        <div data-testid="t--switch-env" />
      </Wrapper>
      <Wrapper>
        <div data-testid="t--debugger" />
        <div data-testid="t--help-button" />
      </Wrapper>
    </Container>
  );
}
