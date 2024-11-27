import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { getTypographyByKey } from "@appsmith/ads-old";
import { Icon, IDE_HEADER_HEIGHT } from "@appsmith/ads";

export const Container = styled.div`
  display: flex;
  cursor: pointer;

  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }

  & .${Classes.EDITABLE_TEXT} {
    height: ${IDE_HEADER_HEIGHT}px !important;
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
    line-height: ${IDE_HEADER_HEIGHT}px !important;
    padding: 0 ${(props) => props.theme.spaces[2]}px;
    height: ${IDE_HEADER_HEIGHT}px !important;
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
