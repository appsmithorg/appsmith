import type { RefObject } from "react";
import React, { forwardRef, useEffect, useRef } from "react";
import styled from "styled-components";

import ResizeObserver from "resize-observer-polyfill";

interface StickyCanvasArenaProps {
  showCanvas: boolean;
  canvasId: string;
  sliderId: string;
  canvasPadding: number;
  getRelativeScrollingParent: (child: HTMLDivElement) => Element | null;
  /**
   * The dependencies object is to make sure the parent of the StickyCanvasArena can submit custom props,
   * those when changed the canvas re-observes to reposition or rescale it selves.
   */
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependencies?: Record<string, any>;
  ref: StickyCanvasArenaRef;
  shouldObserveIntersection: boolean;
  scaleFactor?: number;
}

interface StickyCanvasArenaRef {
  stickyCanvasRef: RefObject<HTMLCanvasElement>;
  slidingArenaRef: RefObject<HTMLDivElement>;
}

const StickyCanvas = styled.canvas`
  position: absolute;
  pointer-events: none;
`;

/**
 * we use IntersectionObserver to detect the amount of canvas(stickyCanvasRef) that is interactable at any point of time
 * and resize and reposition it wrt to the slider(slidingArenaRef).
 * downside to this is it fires events everytime the widget is interactable which is a lot.
 * in this function we process events to check for changes on which updating of the canvas styles is based upon in
 * repositionSliderCanvas and rescaleSliderCanvas functions.
 *
 * if no changes are required then we could safely skip calling the repositionSliderCanvas and rescaleSliderCanvas.
 * Why is it important to limit calling repositionSliderCanvas and rescaleSliderCanvas
 * every time a canvas style is updated(even with the same values) or the canvas is scaled,
 * the canvas loses context and has to be redrawn which is a costly operation if done very frequent.
 */
const shouldUpdateCanvas = (
  currentEntry: IntersectionObserverEntry,
  previousEntry?: IntersectionObserverEntry,
) => {
  if (previousEntry) {
    const {
      boundingClientRect: {
        left: previousBoundingLeft,
        top: previousBoundingTop,
      },
      intersectionRect: {
        height: previousIntersectHeight,
        left: previousIntersectLeft,
        top: previousIntersectTop,
        width: previousIntersectWidth,
      },
    } = previousEntry;
    const {
      boundingClientRect: {
        left: currentBoundingLeft,
        top: currentBoundingTop,
      },
      intersectionRect: {
        height: currentIntersectHeight,
        left: currentIntersectLeft,
        top: currentIntersectTop,
        width: currentIntersectWidth,
      },
    } = currentEntry;
    if (
      previousIntersectHeight === currentIntersectHeight &&
      previousIntersectWidth === currentIntersectWidth &&
      previousIntersectLeft === currentIntersectLeft &&
      previousIntersectTop === currentIntersectTop &&
      previousBoundingTop === currentBoundingTop &&
      previousBoundingLeft === currentBoundingLeft
    ) {
      return false;
    }
  }
  return true;
};

const StyledCanvasSlider = styled.div<{ paddingBottom: number }>`
  position: absolute;
  pointer-events: all;
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: StickyCanvasArenaProps, ref: any) => {
    const {
      canvasId,
      canvasPadding,
      dependencies = {},
      getRelativeScrollingParent,
      scaleFactor = 1,
      shouldObserveIntersection,
      showCanvas,
      sliderId,
    } = props;
    const { slidingArenaRef, stickyCanvasRef } = ref.current;
    const previousIntersectionEntry = useRef<IntersectionObserverEntry>();
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
      stickyCanvasRef.current.style.width = entry.intersectionRect.width + "px";
      stickyCanvasRef.current.style.position = "absolute";
      const calculatedLeftOffset =
        entry.intersectionRect.left - entry.boundingClientRect.left;
      const calculatedTopOffset =
        entry.intersectionRect.top - entry.boundingClientRect.top;
      stickyCanvasRef.current.style.top = calculatedTopOffset + "px";
      stickyCanvasRef.current.style.left = calculatedLeftOffset + "px";
      stickyCanvasRef.current.style.height =
        entry.intersectionRect.height + "px";
    };

    const rescaleSliderCanvas = (entry: IntersectionObserverEntry) => {
      const canvasCtx: CanvasRenderingContext2D =
        stickyCanvasRef.current.getContext("2d");
      stickyCanvasRef.current.height =
        entry.intersectionRect.height * scale * scaleFactor;
      stickyCanvasRef.current.width =
        entry.intersectionRect.width * scale * scaleFactor;
      canvasCtx.scale(scale * scaleFactor, scale * scaleFactor);
    };

    const updateCanvasStylesIntersection = (
      entry: IntersectionObserverEntry,
    ) => {
      if (slidingArenaRef.current) {
        requestAnimationFrame(() => {
          const parentCanvas: Element | null = getRelativeScrollingParent(
            slidingArenaRef.current,
          );

          if (
            parentCanvas &&
            stickyCanvasRef.current &&
            shouldUpdateCanvas(entry, previousIntersectionEntry.current)
          ) {
            repositionSliderCanvas(entry);
            rescaleSliderCanvas(entry);
            previousIntersectionEntry.current = entry;
          }
        });
      }
    };

    const observeSlider = () => {
      // This is to make sure the canvas observes and changes only when needed like when dragging or drw to select.
      if (shouldObserveIntersection) {
        interSectionObserver.current.disconnect();
        if (slidingArenaRef && slidingArenaRef.current) {
          interSectionObserver.current.observe(slidingArenaRef.current);
        }
      }
    };

    useEffect(() => {
      if (slidingArenaRef.current) {
        observeSlider();
      }
    }, [showCanvas, dependencies, shouldObserveIntersection]);

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
    }, [shouldObserveIntersection]);
    return (
      <>
        {/* Canvas will always be sticky to its scrollable parent's view port. i.e,
      it will only be as big as its viewable area so maximum size would be less
  than screen width and height in all cases. */}
        <StickyCanvas
          data-sl="canvas-mq" // attribute to enable canvas on smartlook
          data-testid={canvasId}
          id={canvasId}
          ref={stickyCanvasRef}
        />
        <StyledCanvasSlider
          data-testid={sliderId}
          data-type={"canvas-slider"}
          id={sliderId}
          paddingBottom={canvasPadding}
          ref={slidingArenaRef}
        />
      </>
    );
  },
);
StickyCanvasArena.displayName = "StickyCanvasArena";
