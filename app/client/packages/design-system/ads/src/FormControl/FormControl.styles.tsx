import styled from "styled-components";
import { Text } from "../Text";

export const StyledFormControl = styled.div`
  &[data-label-position="top"] {
    display: flex;
    flex-direction: column;
    gap: var(--ads-v2-spaces-2);
  }

  &[data-label-position="left"] {
    display: grid;
    row-gap: var(--ads-v2-spaces-2);
    column-gap: var(--ads-v2-spaces-4);
    grid-template-areas:
      "label input input"
      "label helper helper"
      "label error error";
    align-items: baseline;
  }
`;

export const StyledLabel = styled.label`
  color: var(--ads-v2-colors-control-label-default-fg);
  font-family: var(--ads-v2-font-family);
  font-size: 14px;
  width: 100%;
  word-wrap: break-word;
  grid-area: label;

  &[data-size="sm"] {
    font-size: 12px;
  }

  & > span {
    color: var(--ads-v2-colors-control-icon-error-fg);
    margin-left: var(--ads-v2-spaces-1);
  }
`;

export const StyledHelper = styled(Text)<{ isDisabled?: boolean }>`
  display: block;
  line-height: unset;
  grid-area: helper;

  &[data-disabled="true"] {
    opacity: var(--ads-v2-opacity-disabled);
    cursor: not-allowed !important;
  }
`;

export const StyledError = styled(Text)`
  display: block;
  line-height: unset;
  grid-area: error;
`;
