import type { RefObject } from "react";
import React, { forwardRef, useEffect, useRef } from "react";
import styled from "styled-components";

import { useSelector } from "react-redux";
import ResizeObserver from "resize-observer-polyfill";
import { getCanvasScale } from "selectors/editorSelectors";
import { isMultiPaneActive } from "selectors/multiPaneSelectors";

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

    const isMultiPane = useSelector(isMultiPaneActive);
    const canvasScale = useSelector(getCanvasScale);

    const interSectionObserver = useRef(
      new IntersectionObserver((entries) => {
        entries.forEach(updateCanvasStylesIntersection);
      }),
    );
    const resizeObserver = useRef(
      new ResizeObserver(() => {
        observeSlider();
      }),
    );

    const { devicePixelRatio: scale = 1 } = window;

    const repositionSliderCanvas = (entry: IntersectionObserverEntry) => {
      if (isMultiPane) {
        stickyCanvasRef.current.style.width =
          entry.intersectionRect.width / canvasScale + "px";
        stickyCanvasRef.current.style.height =
          entry.intersectionRect.height / canvasScale + "px";
      } else {
        stickyCanvasRef.current.style.width =
          entry.intersectionRect.width + "px";
        stickyCanvasRef.current.style.height =
          entry.intersectionRect.height + "px";
      }
      stickyCanvasRef.current.style.position = "absolute";
      const calculatedLeftOffset =
        entry.intersectionRect.left - entry.boundingClientRect.left;
      const calculatedTopOffset =
        entry.intersectionRect.top - entry.boundingClientRect.top;
      stickyCanvasRef.current.style.top = calculatedTopOffset + "px";
      stickyCanvasRef.current.style.left = calculatedLeftOffset + "px";
    };

    const rescaleSliderCanvas = (entry: IntersectionObserverEntry) => {
      const canvasCtx: CanvasRenderingContext2D =
        stickyCanvasRef.current.getContext("2d");
      if (isMultiPane) {
        stickyCanvasRef.current.height =
          entry.intersectionRect.height * canvasScale;
        stickyCanvasRef.current.width =
          entry.intersectionRect.width * canvasScale;
        canvasCtx.scale(canvasScale, canvasScale);
        canvasCtx.transform(canvasScale, 0, 0, canvasScale, 0, 0);
      } else {
        stickyCanvasRef.current.height = entry.intersectionRect.height * scale;
        stickyCanvasRef.current.width = entry.intersectionRect.width * scale;
        canvasCtx.scale(scale, scale);
      }
    };

    const updateCanvasStylesIntersection = (
      entry: IntersectionObserverEntry,
    ) => {
      if (slidingArenaRef.current) {
        const parentCanvas: Element | null = getRelativeScrollingParent(
          slidingArenaRef.current,
        );

        if (parentCanvas && stickyCanvasRef.current) {
          repositionSliderCanvas(entry);
          rescaleSliderCanvas(entry);
        }
      }
    };
    const observeSlider = () => {
      interSectionObserver.current.disconnect();
      if (slidingArenaRef && slidingArenaRef.current) {
        interSectionObserver.current.observe(slidingArenaRef.current);
      }
    };

    useEffect(() => {
      if (slidingArenaRef.current) {
        observeSlider();
      }
    }, [
      showCanvas,
      snapRows,
      canExtend,
      snapColSpace,
      snapRowSpace,
      canvasScale,
    ]);

    useEffect(() => {
      let parentCanvas: Element | null;
      if (slidingArenaRef.current) {
        parentCanvas = getRelativeScrollingParent(slidingArenaRef.current);
        parentCanvas?.addEventListener("scroll", observeSlider, false);
        parentCanvas?.addEventListener("mouseover", observeSlider, false);
      }
      resizeObserver.current.observe(slidingArenaRef.current);
      return () => {
        parentCanvas?.removeEventListener("scroll", observeSlider);
        parentCanvas?.removeEventListener("mouseover", observeSlider);
        if (slidingArenaRef && slidingArenaRef.current) {
          resizeObserver.current.unobserve(slidingArenaRef.current);
        }
      };
    }, []);
    return (
      <>
        {/* Canvas will always be sticky to its scrollable parent's view port. i.e,
      it will only be as big as its viewable area so maximum size would be less
  than screen width and height in all cases. */}
        <canvas
          data-sl="canvas-mq" // attribute to enable canvas on smartlook
          data-testid={canvasId}
          id={canvasId}
          ref={stickyCanvasRef}
          style={{
            position: "absolute",
          }}
        />
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
