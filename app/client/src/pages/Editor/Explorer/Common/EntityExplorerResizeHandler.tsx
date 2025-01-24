import { tailwindLayers } from "constants/Layers";
import React from "react";
import styled from "styled-components";
import useResize, {
  DIRECTION,
  type CallbackResponseType,
} from "utils/hooks/useResize";

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
  const resizeAfterCallback = (data: CallbackResponseType) => {
    localStorage.setItem(storedHeightKey, data.height.toString());
  };

  const { mouseDown, setMouseDown } = useResize(
    resizeRef,
    DIRECTION.vertical,
    resizeAfterCallback,
  );

  return (
    <div
      className={`absolute -bottom-2 left-0 w-full h-2 group cursor-ns-resize ${tailwindLayers.resizer}`}
      onMouseDown={() => setMouseDown(true)}
    >
      <ResizeHandler
        className={`w-full h-1 bg-transparent hover:bg-transparent transform transition	
          ${mouseDown ? "" : ""}	
          `}
      />
    </div>
  );
};
