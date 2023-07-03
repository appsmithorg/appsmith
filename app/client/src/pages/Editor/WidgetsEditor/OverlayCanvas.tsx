/* eslint-disable no-console */
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetPositions } from "selectors/entitiesSelector";
import { getSelectedWidgetDsl } from "selectors/ui";
import styled from "styled-components";
import { debounce } from "lodash";

const OverlayCanvas = styled.canvas`
  position: absolute;
  z-index: 2;
  pointer-events: none;
`;
// const PIXEL_RATIO = window.devicePixelRatio || 1;
const OVERLAY_CANVAS_ID = "overlay-canvas";
const FONT_SIZE = 14;
const LINE_HEIGHT = Math.floor(FONT_SIZE * 1.2);
const VERTICAL_PADDING = 4;
const HORIZONTAL_PADDING = 6;

const HEIGHT = Math.floor(LINE_HEIGHT + VERTICAL_PADDING);

const FILL_COLOR = "rgb(239, 117, 65)";
const TEXT_COLOR = "rgb(255, 255, 255)";

const OverlayCanvasContainer = (props: {
  canvasWidth: number;
  containerRef: any;
}) => {
  const selectedWidgets: FlattenedWidgetProps[] = useSelector(
    getSelectedWidgetDsl(),
  );
  const widgetPositions = useSelector(getWidgetPositions);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const widgetNamePositions = useRef<
    { left: number; top: number; height: number; width: number } | undefined
  >(undefined);

  const canvasPositions = useRef<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const scrollTop = useRef<number>(0);
  const isScrolling = useRef(0);

  useEffect(() => {
    if (canvasRef?.current) {
      const canvas: HTMLCanvasElement = canvasRef?.current as HTMLCanvasElement;
      const context: CanvasRenderingContext2D | null = canvas?.getContext("2d");

      const rect = canvas.getBoundingClientRect();
      if (rect) {
        canvasPositions.current = {
          left: rect.left,
          top: rect.top,
        };
      }
      if (!context) return;
      context.imageSmoothingEnabled = false;
      // canvas.width = canvas.width * PIXEL_RATIO;
      // canvas.height = canvas.height * PIXEL_RATIO;
      // console.log("####", { PIXEL_RATIO });
      // context.scale(PIXEL_RATIO, PIXEL_RATIO);
    }

    return () => {
      resetCanvas();
    };
  }, []);

  useEffect(() => {
    if (!props.containerRef?.current || !canvasRef?.current) return;
    const container: HTMLDivElement = props.containerRef
      ?.current as HTMLDivElement;

    const canvas: HTMLCanvasElement = canvasRef?.current as HTMLCanvasElement;
    const handleMouseMove = debounce((e: any) => {
      if (!canvas) return;
      if (isMouseOver(e)) {
        if (canvas.style.pointerEvents === "none") {
          canvas.style.pointerEvents = "auto";
          canvas.style.cursor = "pointer";
        }
      } else if (canvas.style.pointerEvents !== "none") {
        canvas.style.pointerEvents = "none";
        canvas.style.cursor = "default";
      }
    }, 50);
    const handleScroll = () => {
      if (!props.containerRef?.current) return;
      const currentScrollTop: number = props.containerRef?.current?.scrollTop;
      if (!isScrolling.current) {
        console.log("#### isScrolling", { isScrolling: isScrolling.current });
        resetCanvas();
      }
      clearTimeout(isScrolling.current);
      isScrolling.current = setTimeout(() => {
        console.log("#### scroll stopped", { scrollTop: currentScrollTop });
        scrollTop.current = currentScrollTop;
        drawWidgetNameComponent();
        isScrolling.current = 0;
      }, 100);
    };
    container.addEventListener("scroll", handleScroll);
    container.addEventListener("mousemove", handleMouseMove);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [props.containerRef?.current]);

  const isMouseOver = (e: any) => {
    const x = e.clientX - canvasPositions.current.left;
    const y = e.clientY - canvasPositions.current.top;
    if (widgetNamePositions.current) {
      const { height, left, top, width } = widgetNamePositions.current;
      if (x > left && x < left + width && y > top && y < top + height) {
        return true;
      }
    }

    return false;
  };

  useEffect(() => {
    console.log("!!!! widget positions", { widgetPositions });
    if (!selectedWidgets.length || !Object.keys(widgetPositions)?.length) {
      resetCanvas();
      return;
    }
    drawWidgetNameComponent();
  }, [selectedWidgets, widgetPositions]);

  const drawRoundRect = (
    context: CanvasRenderingContext2D,
    componentWidth: number,
    left: number,
    top: number,
    fillColor: string,
    strokeColor: string,
    radius = 4,
  ) => {
    context.fillStyle = fillColor;
    context.strokeStyle = strokeColor;
    context.roundRect(left, top, componentWidth, HEIGHT, [
      radius,
      radius,
      0,
      0,
    ]);
    context.stroke();
    context.roundRect(left + 1, top + 1, componentWidth - 2, HEIGHT - 2, [
      radius,
      radius,
      0,
      0,
    ]);
    context.fill();
  };

  const drawText = (
    context: CanvasRenderingContext2D,
    text: string,
    left: number,
    top: number,
  ) => {
    context.font = `400 ${FONT_SIZE}px sans-serif`;
    context.fillStyle = TEXT_COLOR;
    context.textBaseline = "hanging";
    context.textAlign = "start";
    context.fillText(
      text,
      left + HORIZONTAL_PADDING,
      top + VERTICAL_PADDING * 1.2,
    );
  };

  const drawWidgetNameComponent = () => {
    if (!canvasRef?.current) return;
    // TODO: @Preet - Add capability for multi selected widgets
    const selectedWidget: FlattenedWidgetProps = selectedWidgets[0];
    if (!selectedWidget) return;
    const text: string = selectedWidget.widgetName;
    const widgetPosition = widgetPositions[selectedWidget.widgetId];
    if (!widgetPosition) return;
    const canvas: HTMLCanvasElement = canvasRef?.current as HTMLCanvasElement;
    const context: CanvasRenderingContext2D | null = canvas?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.beginPath();

    context.font = `400 ${FONT_SIZE}px sans-serif`;
    const textWidth = context.measureText(text).width;
    const componentWidth: number = textWidth + HORIZONTAL_PADDING * 2;

    const left: number =
      widgetPosition.left + widgetPosition.width - componentWidth - 1;
    const top: number = widgetPosition.top + 11 - scrollTop.current;
    console.log("####", {
      left,
      top,
      componentWidth,
      textWidth,
      HEIGHT,
      FONT_SIZE,
      widgetTop: widgetPosition.top,
      scrollTop: scrollTop.current,
    });

    // Draw component background
    drawRoundRect(context, componentWidth, left, top, FILL_COLOR, FILL_COLOR);
    widgetNamePositions.current = {
      left,
      top,
      width: componentWidth,
      height: HEIGHT,
    };

    // Draw text
    drawText(context, text, left, top);

    context.save();
  };

  const resetCanvas = () => {
    if (!canvasRef?.current) return;
    const canvas: HTMLCanvasElement = canvasRef?.current as HTMLCanvasElement;
    const context = canvas?.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);
    context?.save();
    widgetNamePositions.current = undefined;
  };

  return (
    <OverlayCanvas
      height="600"
      id={OVERLAY_CANVAS_ID}
      ref={canvasRef}
      width={props.canvasWidth}
    />
  );
};

export default OverlayCanvasContainer;
