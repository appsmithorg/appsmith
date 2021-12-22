/* eslint-disable no-console */
import styled from "constants/DefaultTheme";
import React, { forwardRef, RefObject, useEffect, useRef } from "react";

interface StickyCanvasArenaProps {
  showCanvas: boolean;
  canvasId: string;
  id: string;
  canvasPadding: number;
  snapRows: number;
  snapColSpace: number;
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
      snapColSpace,
      snapRows,
      snapRowSpace,
    } = props;
    const { slidingArenaRef, stickyCanvasRef } = ref.current;

    const observer = useRef(
      new IntersectionObserver((entries) => {
        entries.forEach(updateCanvasStylesIntersection);
      }),
    );

    const updateCanvasStylesIntersection = (
      entry: IntersectionObserverEntry,
    ) => {
      if (slidingArenaRef.current) {
        const parentCanvas: Element | null = getRelativeScrollingParent(
          slidingArenaRef.current,
        );

        if (parentCanvas && stickyCanvasRef.current) {
          stickyCanvasRef.current.style.width = "100%";
          stickyCanvasRef.current.style.position = "absolute";
          stickyCanvasRef.current.style.left = "0px";
          stickyCanvasRef.current.style.top =
            entry.intersectionRect.top - entry.boundingClientRect.top + "px";
          stickyCanvasRef.current.style.height =
            entry.intersectionRect.height + "px";
        }
      }
    };

    const onScroll = () => {
      observer.current.disconnect();
      observer.current.observe(slidingArenaRef.current);
    };

    useEffect(() => {
      if (showCanvas) {
        onScroll();
      }
    }, [showCanvas, snapRows, canExtend, snapColSpace, snapRowSpace]);

    useEffect(() => {
      let parentCanvas: Element | null;
      if (slidingArenaRef.current) {
        parentCanvas = getRelativeScrollingParent(slidingArenaRef.current);
        parentCanvas?.addEventListener("scroll", onScroll, false);
      }
      return () => {
        parentCanvas?.removeEventListener("scroll", onScroll);
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
