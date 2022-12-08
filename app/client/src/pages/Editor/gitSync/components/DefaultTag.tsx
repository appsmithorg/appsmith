import React from "react";
import styled from "styled-components";
import { Button, Category, Size } from "design-system";

const StyledButton = styled(Button)`
  display: inline-block;
  padding: 3px 7px;
  position: absolute;
  right: 16%;
`;

export default function DefaultTag() {
  return (
    <StyledButton
      category={Category.secondary}
      data-testid="t--default-tag"
      disabled
      size={Size.xxs}
      text={"DEFAULT"}
    />
  );
}
