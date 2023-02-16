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

export const theming = (Story, { globals }) => {
  return (
    <StyledContainer accentColor="#553DE9" borderRadius={globals.borderRadius}>
      <Story />
    </StyledContainer>
  );
};
