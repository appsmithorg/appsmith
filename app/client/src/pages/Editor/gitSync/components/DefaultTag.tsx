import React from "react";
import styled from "styled-components";
import { Button } from "design-system";

const StyledButton = styled(Button)`
  display: inline-block;
  position: absolute;
  right: 16%;
`;

export default function DefaultTag() {
  return (
    <StyledButton
      data-testid="t--default-tag"
      isDisabled
      kind="secondary"
      size="sm"
    >
      Default
    </StyledButton>
  );
}
