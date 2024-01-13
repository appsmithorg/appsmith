import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { getTypographyByKey } from "design-system-old";
import { Icon } from "design-system";

export const Container = styled.div`
  display: flex;
  cursor: pointer;
  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
  & .${Classes.EDITABLE_TEXT} {
    height: ${(props) => props.theme.smallHeaderHeight} !important;
    display: block;
    cursor: pointer;
  }
  &&&& .${Classes.EDITABLE_TEXT}, &&&& .${Classes.EDITABLE_TEXT_EDITING} {
    padding: 0;
    width: 100%;
  }
  &&&& .${Classes.EDITABLE_TEXT_CONTENT}, &&&& .${Classes.EDITABLE_TEXT_INPUT} {
    display: block;
    ${getTypographyByKey("h5")};
    line-height: ${(props) => props.theme.smallHeaderHeight} !important;
    padding: 0 ${(props) => props.theme.spaces[2]}px;
    height: ${(props) => props.theme.smallHeaderHeight} !important;
  }
  &&&& .${Classes.EDITABLE_TEXT_INPUT} {
    margin-right: 20px;
  }
`;

export const StyledIcon = styled(Icon)`
  height: 100%;
  padding-right: ${(props) => props.theme.spaces[2]}px;
  align-self: center;
`;
