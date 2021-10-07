/* eslint-disable no-console */
import styled from "constants/DefaultTheme";
import React, { forwardRef, RefObject, useCallback, useEffect } from "react";
import { getCanvasTopOffset } from "./utils";

interface StickyCanvasArenaProps {
  showCanvas: boolean;
  canvasId: string;
  id: string;
  canvasPadding: number;
  snapRows: number;
  snapRowSpace: number;
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
      snapRows,
      snapRowSpace,
    } = props;
    const { slidingArenaRef, stickyCanvasRef } = ref.current;

    const updateCanvasStyles = useCallback(() => {
      if (slidingArenaRef.current) {
        const parentCanvas: Element | null = getRelativeScrollingParent(
          slidingArenaRef.current,
        );

        if (parentCanvas && stickyCanvasRef.current) {
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
          stickyCanvasRef.current.style.height =
            Math.min(scrollParentTopHeight, height) + "px";
        }
      }
    }, [snapRows, canExtend]);
    const updateSliderHeight = () => {
      if (slidingArenaRef.current) {
        const {
          height: canvasHeight,
        } = slidingArenaRef.current.getBoundingClientRect();
        const height = snapRows * snapRowSpace + canvasPadding;
        if (canvasHeight !== height) {
          // setting styles to recalculate height when widget is deleted or copy pasted.
          // this is done coz we do a ref style update in DropTargetComponent which is not updating slider in time.
          // ToDo(Ashok): Might need a better understanding of refs and forwardRefs to handle this without creating exceptions.
          slidingArenaRef.current.style.height = "100%";
        }
      }
    };
    useEffect(() => {
      if (showCanvas) {
        updateSliderHeight();
        updateCanvasStyles();
      }
    }, [snapRows, canExtend]);

    useEffect(() => {
      let parentCanvas: Element | null;
      if (slidingArenaRef.current) {
        parentCanvas = getRelativeScrollingParent(slidingArenaRef.current);
        parentCanvas?.addEventListener("scroll", updateCanvasStyles, false);
      }
      return () => {
        parentCanvas?.removeEventListener("scroll", updateCanvasStyles);
      };
    }, []);

    return (
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
    );
  },
);
StickyCanvasArena.displayName = "StickyCanvasArena";
