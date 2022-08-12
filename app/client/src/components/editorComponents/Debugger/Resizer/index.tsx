import { Layers } from "constants/Layers";
import React, { useState, useEffect, RefObject } from "react";
import styled, { css } from "styled-components";

export const ResizerCSS = css`
  width: 100%;
  z-index: ${Layers.debugger};
  position: relative;
`;

const Top = styled.div`
  position: absolute;
  cursor: ns-resize;
  height: 4px;
  width: 100%;
  z-index: 1;
  left: 0;
  top: 0;
`;

type ResizerProps = {
  panelRef: RefObject<HTMLDivElement>;
  setContainerDimensions?: (height: number) => void;
  snapToHeight?: number;
  openResizer?: boolean;
};

function Resizer(props: ResizerProps) {
  const [mouseDown, setMouseDown] = useState(false);

  const handleResize = (movementY: number) => {
    const panel = props.panelRef.current;
    if (!panel) return;

    const { height } = panel.getBoundingClientRect();
    const updatedHeight = height - movementY;
    const headerHeightNumber = 35;
    const minHeight = parseInt(
      window.getComputedStyle(panel).minHeight.replace("px", ""),
    );

    if (
      updatedHeight < window.innerHeight - headerHeightNumber &&
      updatedHeight > minHeight
    ) {
      panel.style.height = `${height - movementY}px`;
      props.setContainerDimensions &&
        props.setContainerDimensions(height - movementY);
    }
  };

  useEffect(() => {
    handleResize(0);
  }, []);

  useEffect(() => {
    // if the resizer is configured to open and the user is not actively controlling it
    // snap the resizer to a specific height as specified by the snapToHeight prop.
    if (props.openResizer && !mouseDown) {
      const panel = props.panelRef.current;
      if (!panel) return;

      const { height } = panel.getBoundingClientRect();

      if (props?.snapToHeight && height < props?.snapToHeight) {
        panel.style.height = `${props?.snapToHeight}px`;
        props.setContainerDimensions &&
          props.setContainerDimensions(props?.snapToHeight);
      }
    }
  }, [props?.openResizer]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleResize(e.movementY);
    };

    if (mouseDown) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseDown]);

  useEffect(() => {
    const handleMouseUp = () => setMouseDown(false);

    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = () => {
    setMouseDown(true);
  };

  return <Top onMouseDown={handleMouseDown} />;
}

export default Resizer;
