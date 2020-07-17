import React, { ReactNode } from "react";
import styled from "styled-components";
import { Collapse } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

const TRACK_WIDTH = 1;

const CollapsedContainer = styled.div<{ step: number }>`
  overflow: hidden;
  &:before {
    content: "";
    width: ${TRACK_WIDTH}px;
    background: ${Colors.TROUT};
    bottom: ${props => props.theme.spaces[2]}px;
    left: ${props => (props.step + 1) * props.theme.spaces[2] + TRACK_WIDTH}px;
    top: ${props => -props.theme.spaces[2]}px;
    position: absolute;
  }
`;
export const EntityCollapse = (props: {
  children: ReactNode;
  isOpen: boolean;
  step: number;
}) => {
  if (!props.children) return null;
  return (
    <Collapse isOpen={props.isOpen} keepChildrenMounted>
      <CollapsedContainer step={props.step}>
        {props.children}
      </CollapsedContainer>
    </Collapse>
  );
};

export default EntityCollapse;
