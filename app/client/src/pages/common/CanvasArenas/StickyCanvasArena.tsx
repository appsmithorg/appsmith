/* eslint-disable no-console */
import styled from "constants/DefaultTheme";
import React, { forwardRef, RefObject, useEffect } from "react";
import { intersectionAPI } from "./hooks/useIntersectionAPI";
import { getCanvasTopOffset } from "./utils";

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

    const updateCanvasStyles = (snapRowChange = false) => {
      if (slidingArenaRef.current) {
        const parentCanvas: Element | null = getRelativeScrollingParent(
          slidingArenaRef.current,
        );

        if (parentCanvas && stickyCanvasRef.current) {
          const {
            height: scrollParentTopHeight,
          } = parentCanvas.getBoundingClientRect();
          const sliderBounds = slidingArenaRef.current.getBoundingClientRect();
          const snapRowsHeight = snapRows * snapRowSpace + canvasPadding;
          // recalculating height when widget is deleted or copy pasted.
          // this is done coz we do a ref style update in DropTargetComponent which is not updating slider in time.
          // ToDo(Ashok): Might need a better understanding of refs and forwardRefs to handle this without creating exceptions.
          const sliderHeight = snapRowChange
            ? snapRowsHeight
            : sliderBounds.height;
          const isProjectorBiggerThanSlider =
            sliderHeight > scrollParentTopHeight;
          const calculatedTopPosition = getCanvasTopOffset(
            slidingArenaRef,
            stickyCanvasRef,
            canExtend,
          );
          stickyCanvasRef.current.style.width = "100%";
          stickyCanvasRef.current.style.position = canExtend
            ? "absolute"
            : "sticky";
          stickyCanvasRef.current.style.left = "0px";
          if (canExtend) {
            stickyCanvasRef.current.style.top =
              (isProjectorBiggerThanSlider
                ? Math.min(
                    calculatedTopPosition,
                    sliderHeight - scrollParentTopHeight,
                  )
                : calculatedTopPosition) + "px";
          } else {
            stickyCanvasRef.current.style.top =
              (isProjectorBiggerThanSlider
                ? Math.min(
                    calculatedTopPosition,
                    sliderHeight - scrollParentTopHeight,
                  )
                : calculatedTopPosition) + "px";
          }
          stickyCanvasRef.current.style.height =
            Math.min(window.innerHeight, scrollParentTopHeight, sliderHeight) +
            "px";
        }
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
          stickyCanvasRef.current.style.width = "100%";
          stickyCanvasRef.current.style.position = "absolute";
          stickyCanvasRef.current.style.left = "0px";
          stickyCanvasRef.current.style.top =
            ((entry.rootBounds && entry.rootBounds.top) || 0) -
            entry.boundingClientRect.top +
            "px";
          stickyCanvasRef.current.style.height =
            entry.intersectionRect.height + "px";
        }
      }
    };
    const updateIntersection = (entries: IntersectionObserverEntry[]) => {
      if (entries && entries.length) {
        updateCanvasStylesIntersection(entries[0]);
      }
    };
    const onScroll = () => {
      const parentCanvas = getRelativeScrollingParent(slidingArenaRef.current);
      intersectionAPI(updateIntersection, id, parentCanvas);
    };

    useEffect(() => {
      if (showCanvas) {
        updateCanvasStyles(true);
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
