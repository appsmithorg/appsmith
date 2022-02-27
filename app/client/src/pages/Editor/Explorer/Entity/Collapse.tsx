import React, { ReactNode } from "react";
import styled from "styled-components";
import { Collapse } from "@blueprintjs/core";

const CollapsedContainer = styled.div<{ step: number; active?: boolean }>`
  overflow: hidden;
  position: relative;
`;
export function EntityCollapse(props: {
  children: ReactNode;
  isOpen: boolean;
  ref?: React.Ref<HTMLDivElement>;
  step: number;
  active?: boolean;
}) {
  if (!props.children) return null;
  return (
    <Collapse isOpen={props.isOpen}>
      <CollapsedContainer active={props.active} step={props.step}>
        {props.children}
      </CollapsedContainer>
    </Collapse>
  );
}

export default EntityCollapse;
