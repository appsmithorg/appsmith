import Button, { Category, Size } from "components/ads/Button";
import React from "react";
import styled from "styled-components";

const StyledButton = styled(Button)`
  display: inline-block;
  padding: 3px 7px;
  position: absolute;
  right: 16%;
`;

export default function DefaultTag() {
  return (
    <StyledButton
      category={Category.tertiary}
      data-testid="t--default-tag"
      disabled
      size={Size.xxs}
      text={"DEFAULT"}
    />
  );
}
