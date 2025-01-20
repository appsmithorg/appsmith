import { tailwindLayers } from "constants/Layers";
import React, { useState } from "react";
import styled from "styled-components";

const COLLAPSED_HEIGHT = 200;
const EXPANDED_HEIGHT = 400;

const ResizeHandler = styled.div`
  &:hover {
    background-color: var(--ads-v2-color-border);
  }
`;

export const EntityExplorerResizeHandler = ({
  resizeRef,
  storedHeightKey,
}: {
  resizeRef: React.RefObject<HTMLDivElement>;
  storedHeightKey: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const storedHeight = localStorage.getItem(storedHeightKey);

    return storedHeight ? parseInt(storedHeight, 10) > COLLAPSED_HEIGHT : false;
  });

  const handleClick = React.useCallback(() => {
    const newHeight = isExpanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;

    if (resizeRef.current) {
      resizeRef.current.style.height = `${newHeight}px`;
      resizeRef.current.style.transition = "height 0.2s ease-in-out";
    }

    localStorage.setItem(storedHeightKey, newHeight.toString());
    setIsExpanded(!isExpanded);
  }, [isExpanded, resizeRef, storedHeightKey]);

  return (
    <div
      className={`absolute -bottom-2 left-0 w-full h-2 group cursor-pointer ${tailwindLayers.resizer}`}
      onClick={handleClick}
    >
      <ResizeHandler
        className={`w-full h-1 bg-transparent hover:bg-transparent transform transition`}
      />
    </div>
  );
};
