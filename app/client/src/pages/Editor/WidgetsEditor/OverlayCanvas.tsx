import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetPositions } from "selectors/entitiesSelector";
import { getSelectedWidgetDsl } from "selectors/ui";
import styled from "styled-components";

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

const OverlayCanvasContainer = (props: { canvasWidth: number }) => {
  const selectedWidgets: FlattenedWidgetProps[] = useSelector(
    getSelectedWidgetDsl(),
  );
  const widgetPositions = useSelector(getWidgetPositions);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef?.current) {
      const canvas: HTMLCanvasElement = canvasRef?.current as HTMLCanvasElement;
      const context: CanvasRenderingContext2D | null = canvas?.getContext("2d");
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
  }, [canvasRef?.current]);

  useEffect(() => {
    if (!selectedWidgets.length || !Object.keys(widgetPositions)?.length) {
      resetCanvas();
      return;
    }
    drawWidgetNameComponent();
  }, [selectedWidgets]);

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
      top + VERTICAL_PADDING * 1.4,
    );
  };

  const drawWidgetNameComponent = () => {
    if (!canvasRef?.current) return;
    // TODO: @Preet - Add capability for multi selected widgets
    const selectedWidget: FlattenedWidgetProps = selectedWidgets[0];
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
    const top: number = widgetPosition.top + 11;
    console.log("####", {
      left,
      top,
      componentWidth,
      textWidth,
      HEIGHT,
      FONT_SIZE,
    });

    // Draw component background
    drawRoundRect(context, componentWidth, left, top, FILL_COLOR, FILL_COLOR);

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
  };

  return (
    <OverlayCanvas
      id={OVERLAY_CANVAS_ID}
      ref={canvasRef}
      width={props.canvasWidth}
    />
  );
};

export default OverlayCanvasContainer;
