import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { Classes } from "components/ads";

export const BranchListItemContainer = styled.div<{
  selected?: boolean;
  active?: boolean;
  isDefault?: boolean;
}>`
  padding: ${(props) =>
    `${props.theme.spaces[5]}px ${props.theme.spaces[5]}px`};
  margin: ${(props) => `${props.theme.spaces[1]} 0`};
  ${(props) => getTypographyByKey(props, "p1")};
  cursor: pointer;

  &:hover {
    background-color: ${Colors.Gallery};
  }

  width: 100%;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: ${(props) =>
    props.selected || props.active ? Colors.GREY_3 : ""};

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
`;
