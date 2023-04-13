import styled from "styled-components";
import { Classes, getTypographyByKey } from "design-system-old";

export const BranchListItemContainer = styled.div<{
  selected?: boolean;
  active?: boolean;
  isDefault?: boolean;
}>`
  padding: ${(props) =>
    `${props.theme.spaces[5]}px ${props.theme.spaces[5]}px`};
  margin: ${(props) => `${props.theme.spaces[1]} 0`};
  color: var(--ads-v2-color-fg-brand-emphasis);
  ${getTypographyByKey("p1")};
  cursor: pointer;

  width: 100%;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: ${(props) =>
    props.selected || props.active ? "var(--ads-v2-color-bg-emphasis)" : ""};

  ${(props) =>
    !props.active &&
    `&:hover {
background-color: var(--ads-v2-color-bg-subtle);
}`}

  display: grid;
  grid-gap: 16px;
  grid-template-columns: 9fr 1fr;

  & .bp3-popover-wrapper {
    height: 22px;
  }

  .${Classes.TEXT} {
    width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  & .bp3-overlay .bp3-popover.bp3-minimal .cs-text {
    width: fit-content;
  }

  height: 45px;
`;
