import React from "react";
import styled from "styled-components";
import Entity, { EntityClassNames } from "../Entity";
import { tailwindLayers } from "constants/Layers";
import type { CallbackResponseType } from "utils/hooks/useResize";
import useResize, { DIRECTION } from "utils/hooks/useResize";

export const ENTITY_HEIGHT = 36;
export const MIN_PAGES_HEIGHT = 60;

export const RelativeContainer = styled.div`
  position: relative;
`;

export const StyledEntity = styled(Entity)<{ entitySize?: number }>`
  &.pages > div:not(.t--entity-item) > div > div,
  &.query-modules > div:not(.t--entity-item) > div > div {
      max-height: 40vh;
      min-height: ${({ entitySize }) =>
        entitySize && entitySize > MIN_PAGES_HEIGHT
          ? MIN_PAGES_HEIGHT
          : entitySize}px;
      height: ${({ entitySize }) =>
        entitySize && entitySize > 128 ? 128 : entitySize}px;
      overflow-y: auto;
    }
  }

  &.page .${EntityClassNames.PRE_RIGHT_ICON} {
    width: 20px;
    right: 0;
  }

  &.page:hover {
    & .${EntityClassNames.PRE_RIGHT_ICON} {
      display: none;
    }
  }
`;

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

export const ExplorerWrapper = (props: any) => (
  <div
    className={`flex-1 flex flex-col overflow-hidden ${tailwindLayers.entityExplorer}`}
  >
    {props.children}
  </div>
);

const Wrapper = styled.div`
  height: 100%;
  overflow-y: auto;
  -ms-overflow-style: none;
`;

export const EntityExplorerWrapper = (props: any) => {
  return (
    <Wrapper
      className={`t--entity-explorer-wrapper relative overflow-y-auto ${
        props.isActive ? "" : "hidden"
      }`}
      ref={props.explorerRef}
    >
      {props.children}
    </Wrapper>
  );
};
