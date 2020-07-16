import React, { ReactNode } from "react";
import styled from "styled-components";
import { Collapse, Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

const TRACK_WIDTH = 1;
const StyledCollapse = styled(Collapse)`
  & {
    .${Classes.COLLAPSE_BODY} > div {
      padding-left: ${props => props.theme.spaces[3]}px;
      overflow: hidden;
      &:before {
        content: "";
        width: ${TRACK_WIDTH}px;
        background: ${Colors.TROUT};
        bottom: ${props => props.theme.spaces[2]}px;
        left: ${props => props.theme.spaces[3] - TRACK_WIDTH}px;
        top: ${props => props.theme.spaces[2]}px;
        position: absolute;
      }
    }
  }
`;
export const EntityCollapse = (props: {
  children: ReactNode;
  isOpen: boolean;
}) => {
  if (!props.children) return null;
  return (
    <StyledCollapse isOpen={props.isOpen} keepChildrenMounted>
      <div>{props.children}</div>
    </StyledCollapse>
  );
};

export default EntityCollapse;
