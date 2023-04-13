import styled from "styled-components";

import type { InlineInputProps } from "@design-system/headless";
import { InlineInput as HeadlessInlineInput } from "@design-system/headless";

/**
 *
 * @param prop
 * @returns
 */
const shouldForwardProp = (prop: any) => {
  const propsToOmit = ["labelPosition"];

  return !propsToOmit.includes(prop);
};

export const StyledInlineInput = styled(HeadlessInlineInput).withConfig({
  shouldForwardProp,
})<InlineInputProps>`
  display: flex;
  gap: var(--spacing-2);
  flex-direction: ${({ labelPosition }) =>
    labelPosition === "left" ? "row-reverse" : "row"};

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
  }

  .error {
  }

  .description {
  }
`;
