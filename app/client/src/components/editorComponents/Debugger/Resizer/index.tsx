import { Layers } from "constants/Layers";
import type { RefObject } from "react";
import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { ActionExecutionResizerHeight } from "PluginActionEditor/components/PluginActionResponse/constants";

export const ResizerCSS = css`
  width: 100%;
  z-index: ${Layers.debugger};
  position: relative;
`;

const Top = styled.div`
  cursor: ns-resize;
  height: 4px;
  width: 100%;
  margin-bottom: -2px;
`;

interface ResizerProps {
  panelRef: RefObject<HTMLDivElement>;
  setContainerDimensions?: (height: number) => void;
  onResizeComplete?: (height: number) => void;
  snapToHeight?: number;
  openResizer?: boolean;
  initialHeight?: number;
  minHeight?: number;
}

function Resizer(props: ResizerProps) {
  const [mouseDown, setMouseDown] = useState(false);
  const [height, setHeight] = useState(
    props.initialHeight ||
      props.panelRef.current?.getBoundingClientRect().height ||
      ActionExecutionResizerHeight,
  );

  // On mount and update, set the initial height of the component
  useEffect(() => {
    if (!props.initialHeight) return;

    const panel = props.panelRef.current;

    if (!panel) return;

    panel.style.height = `${props.initialHeight}px`;

    if (height !== props.initialHeight) {
      setHeight(props.initialHeight);
    }
  }, [props.initialHeight]);

  const handleResize = (movementY: number) => {
    const panel = props.panelRef.current;

    if (!panel) return;

    const { height } = panel.getBoundingClientRect();
    const updatedHeight = height - movementY;
    const headerHeightNumber = 35;

    if (
      updatedHeight < window.innerHeight - headerHeightNumber &&
      updatedHeight > (props.minHeight || 0)
    ) {
      panel.style.height = `${height - movementY}px`;
      setHeight(height - movementY);
      props.setContainerDimensions &&
        props.setContainerDimensions(height - movementY);
    }
  };

  const handleResizeComplete = () => {
    props.onResizeComplete && props.onResizeComplete(height);
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
    } else {
      handleResizeComplete();
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
