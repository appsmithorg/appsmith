import React from "react";
import styled from "styled-components";
import { Tag } from "design-system";

const StyledTag = styled(Tag)`
  display: inline-block;
  position: absolute;
  right: 16%;
  padding-bottom: 20px;
`;

export default function DefaultTag() {
  return (
    <StyledTag data-testid="t--default-tag" isClosable={false} size="sm">
      Default
    </StyledTag>
  );
}
