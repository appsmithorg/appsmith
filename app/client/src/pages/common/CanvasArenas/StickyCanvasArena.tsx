import styled from "constants/DefaultTheme";
import React, { forwardRef, RefObject, useEffect } from "react";
import { getCanvasTopOffset } from "./utils";

interface StickyCanvasArenaProps {
  showCanvas: boolean;
  canvasId: string;
  id: string;
  canvasPadding: number;
  snapRows: number;
  getRelativeScrollingParent: (child: HTMLDivElement) => Element | null;
  canExtend: boolean;
  ref: StickyCanvasArenaRef;
}

interface StickyCanvasArenaRef {
  stickyCanvasRef: RefObject<HTMLCanvasElement>;
  slidingArenaRef: RefObject<HTMLDivElement>;
}

const StyledCanvasSlider = styled.div<{ paddingBottom: number }>`
  position: absolute;
  top: 0px;
  left: 0px;
  height: calc(100% + ${(props) => props.paddingBottom}px);
  width: 100%;
  image-rendering: -moz-crisp-edges;
  image-rendering: -webkit-crisp-edges;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  overflow-y: auto;
`;

export const StickyCanvasArena = forwardRef(
  (props: StickyCanvasArenaProps, ref: any) => {
    const {
      canExtend,
      canvasId,
      canvasPadding,
      getRelativeScrollingParent,
      id,
      showCanvas,
    } = props;
    const { slidingArenaRef, stickyCanvasRef } = ref.current;

    const updateCanvasStyles = () => {
      if (slidingArenaRef.current) {
        const parentCanvas: Element | null = getRelativeScrollingParent(
          slidingArenaRef.current,
        );

        if (
          parentCanvas &&
          stickyCanvasRef.current &&
          slidingArenaRef.current
        ) {
          const {
            height: scrollParentTopHeight,
          } = parentCanvas.getBoundingClientRect();
          const {
            height,
            width,
          } = slidingArenaRef.current.getBoundingClientRect();
          const calculatedTopPosition = getCanvasTopOffset(
            slidingArenaRef,
            stickyCanvasRef,
            canExtend,
          );
          stickyCanvasRef.current.style.width = width + "px";
          stickyCanvasRef.current.style.position = canExtend
            ? "absolute"
            : "sticky";
          stickyCanvasRef.current.style.left = "0px";
          stickyCanvasRef.current.style.top =
            Math.min(calculatedTopPosition, height - scrollParentTopHeight) +
            "px";
          stickyCanvasRef.current.style.height = scrollParentTopHeight + "px";
        }
      }
    };

    useEffect(() => {
      if (slidingArenaRef.current) {
        const parentCanvas: Element | null = getRelativeScrollingParent(
          slidingArenaRef.current,
        );
        updateCanvasStyles();
        parentCanvas?.addEventListener("scroll", updateCanvasStyles, false);
      }
    });

    useEffect(() => {
      updateCanvasStyles();
    }, [props.snapRows]);

    return showCanvas ? (
      <>
        {/* Canvas will always be sticky to its scrollable parent's view port. i.e,
      it will only be as big as its viewable area so maximum size would be less
  than screen width and height in all cases. */}
        <canvas data-testid={canvasId} id={canvasId} ref={stickyCanvasRef} />
        <StyledCanvasSlider
          data-testid={id}
          id={id}
          paddingBottom={canvasPadding}
          ref={slidingArenaRef}
        />
      </>
    ) : null;
  },
);
StickyCanvasArena.displayName = "StickyCanvasArena";
