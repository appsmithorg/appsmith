import React from "react";
import styled from "styled-components";

import { createTokens } from "../../src/utils/createTokens";

const StyledContainer = styled.div`
  ${createTokens}

  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

export const theming = (Story, args) => {
  return (
    <StyledContainer
      accentColor={args.globals.accentColor || "#553DE9"}
      borderRadius={args.globals.borderRadius}
    >
      <Story />
    </StyledContainer>
  );
};
