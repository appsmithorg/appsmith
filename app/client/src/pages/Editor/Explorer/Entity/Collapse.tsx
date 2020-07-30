import React, { ReactNode } from "react";
import styled from "styled-components";
import { Collapse } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

const TRACK_WIDTH = 1;

const CollapsedContainer = styled.div<{ step: number; active?: boolean }>`
  overflow: hidden;
  &:before {
    ${props => (props.active ? `content: ""` : "")};
    width: ${TRACK_WIDTH}px;
    background: ${Colors.TUNDORA};
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
  active?: boolean;
}) => {
  if (!props.children) return null;
  return (
    <Collapse isOpen={props.isOpen} keepChildrenMounted>
      <CollapsedContainer step={props.step} active={props.active}>
        {props.children}
      </CollapsedContainer>
    </Collapse>
  );
};

export default EntityCollapse;
