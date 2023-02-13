import styled, { css } from "styled-components";

import { InputWrapperBaseProps } from "./InputWrapper";

export const Wrapper = styled.div<Pick<InputWrapperBaseProps, "labelPosition">>`
  & label,
  & [data-component="input-label"] {
    grid-area: label;
    align-items: center;
  }

  & > div {
    grid-area: input;
  }

  & p[data-component="alert"] {
    grid-area: error;
  }

  & p[data-component="description"] {
    grid-area: description;
  }

  ${({ labelPosition }) =>
    labelPosition === "left" &&
    `
      display: grid;
      grid-gap: 6px;
      grid-template-columns: auto 1fr;
      grid-template-rows: auto;
      grid-template-areas:
        "label input"
        ". description"
        ". error";
  `};

  ${({ labelPosition }) =>
    labelPosition === "top" &&
    `
      display: flex;
      gap: 6px;
      flex-direction: column;
  `};
`;
