import React, { useState, useEffect } from "react";
import styled from "styled-components";

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
  onResize: (movementY: number) => void;
};

const Resizer = (props: ResizerProps) => {
  const [mouseDown, setMouseDown] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      props.onResize(e.movementY);
    };

    if (mouseDown) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseDown, props.onResize]);

  useEffect(() => {
    const handleMouseUp = () => setMouseDown(false);

    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = () => () => {
    setMouseDown(true);
  };

  return <Top onMouseDown={handleMouseDown()} />;
};

export default Resizer;
