import React from "react";
import styled from "styled-components";
import { Button } from "design-system";

const StyledButton = styled(Button)`
  display: inline-block;
  position: absolute;
  right: 16%;
`;

// TODO (tanvi): This should not be a button!!! This should be a tag. We have a tag. Use that.
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
