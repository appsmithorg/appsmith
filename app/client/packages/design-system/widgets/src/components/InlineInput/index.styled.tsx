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
  justify-content: space-between;

  ${({ labelPosition }) => css`
    flex-direction: ${labelPosition === "left" ? "row-reverse" : "row"};
  `};

  .label-wrapper {
    display: inline-flex;
    flex-direction: column;
    cursor: pointer;
    line-height: 20px;
    font-size: 14px;
    gap: var(--spacing-1);
    flex: 1;
  }
`;

export const StyledLabel = styled.label<
  Pick<InlineInputProps, "labelAlignment">
>`
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: ${({ labelAlignment }) => {
    if (labelAlignment === "right") return "flex-end";

    return "flex-start";
  }};

  &[data-disabled="true"] {
    opacity: var(--opacity-disabled);
  }
`;
