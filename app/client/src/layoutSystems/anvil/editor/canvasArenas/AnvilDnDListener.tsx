import type { Ref, RefObject } from "react";
import React, { forwardRef } from "react";
import styled from "styled-components";

interface AnvilDnDListenerProps {
  paddingLeft: number;
  paddingTop: number;
  ref: RefObject<HTMLDivElement>;
  zIndex: number;
}

const StyledDnDListener = styled.div<{
  sectionPadding: number;
  zIndex: number;
}>`
  position: absolute;
  pointer-events: all;
  top: 0px;
  left: ${(props) => -props.sectionPadding}px;
  height: 100%;
  width: calc(100% + ${(props) => 2 * props.sectionPadding}px);
  padding-inline: ${(props) => props.sectionPadding}px;
  z-index: ${(props) => props.zIndex};
`;

export const AnvilDnDListener = forwardRef(
  (props: AnvilDnDListenerProps, ref: Ref<HTMLDivElement>) => {
    const { paddingLeft, zIndex } = props;

    return (
      <StyledDnDListener
        data-type={"canvas-slider"}
        ref={ref}
        sectionPadding={paddingLeft}
        zIndex={zIndex}
      />
    );
  },
);
