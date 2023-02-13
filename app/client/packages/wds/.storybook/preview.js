import React from "react";
import styled from "styled-components";
import { Resizable } from "re-resizable";

import { createTokens } from "../src/utils/createTokens";

import "./styles.css";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
    expanded: true,
  },
};

const StyledContainer = styled.div`
  ${createTokens}

  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

// since our widgets can resized to any size, we are just  wrapping them in a resizable container
// to emulate it
export const decorators = [
  (Story, { parameters }) => (
    <StyledContainer accentColor="#553DE9" borderRadius="0.375rem">
      <Resizable
        grid={[8, 8]}
        defaultSize={{
          width: parameters.width,
          height: parameters.height,
        }}
      >
        <Story />
      </Resizable>
    </StyledContainer>
  ),
];
