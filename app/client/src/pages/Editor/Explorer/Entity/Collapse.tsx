import React, { RefObject, ReactNode } from "react";
import styled from "styled-components";
import { Collapse } from "@blueprintjs/core";

const CollapsedContainer = styled.div<{ step: number; active?: boolean }>`
  overflow: hidden;
`;
export function EntityCollapse(props: {
  children: ReactNode;
  isOpen: boolean;
  collapseRef?: RefObject<HTMLDivElement> | null;
  step: number;
  active?: boolean;
}) {
  if (!props.children) return null;
  return (
    <Collapse isOpen={props.isOpen}>
      <CollapsedContainer
        active={props.active}
        ref={props.collapseRef}
        step={props.step}
      >
        {props.children}
      </CollapsedContainer>
    </Collapse>
  );
}

export default EntityCollapse;
