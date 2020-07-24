import React, { createRef, useEffect, useState } from "react";
import styled from "styled-components";
import { Tooltip } from "@blueprintjs/core";

const CellWrapper = styled.div<{ isHidden?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: ${props => (props.isHidden ? "0.6" : "1")};
  .image-cell {
    width: 40px;
    height: 32px;
    margin: 0 5px 0 0;
    border-radius: 4px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  video {
    border-radius: 4px;
  }
  &.video-cell {
    height: 100%;
    iframe {
      border: none;
      border-radius: 4px;
    }
  }
`;

const AutoToolTipComponent = (props: {
  isHidden?: boolean;
  children: React.ReactNode;
  title: string;
}) => {
  const ref = createRef<HTMLDivElement>();
  const [useToolTip, updateToolTip] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element && element.offsetWidth < element.scrollWidth) {
      updateToolTip(true);
    }
  }, [ref]);
  return (
    <CellWrapper ref={ref} isHidden={props.isHidden}>
      {useToolTip ? (
        <Tooltip
          autoFocus={false}
          hoverOpenDelay={1000}
          content={props.title}
          position="top"
        >
          {props.children}
        </Tooltip>
      ) : (
        props.children
      )}
    </CellWrapper>
  );
};

export default AutoToolTipComponent;
