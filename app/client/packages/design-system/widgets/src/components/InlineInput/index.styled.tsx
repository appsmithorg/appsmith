import styled, { css } from "styled-components";

import type { InlineInputProps } from ".";

/**
 * filter out props that should not be forwarded to the DOM
 *
 * @param prop
 * @returns
 */
const shouldForwardProp = (prop: any) => {
  const propsToOmit = ["labelPosition"];

  return !propsToOmit.includes(prop);
};

export const StyledInlineInput = styled.div.withConfig({
  shouldForwardProp,
})<Pick<InlineInputProps, "labelPosition">>`
  display: flex;
  gap: var(--spacing-2);
  width: 100%;

  ${({ labelPosition }) => css`
    flex-direction: ${labelPosition === "left" ? "row-reverse" : "row"};
    justify-content: ${
      labelPosition === "left" ? "space-between" : "flex-start"
    }};
  `};

  .label-wrapper {
    display: inline-flex;
    flex-direction: column;
    cursor: pointer;
    line-height: 20px;
    font-size: 14px;
    gap: var(--spacing-1);
  }

  .label {
    min-height: 20px;
    display: flex;
    align-items: center;

    &[data-disabled="true"] {
      opacity: var(--opacity-disabled);
    }
  }

  .error {
  }

  .description {
  }
`;
