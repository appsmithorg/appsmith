/* eslint-disable no-console */
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { getPositionOfSelectedWidget } from "selectors/entitiesSelector";
import { debounce } from "lodash";
import { Layer, Stage } from "react-konva";
import Konva from "konva";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
// import type { Stage as StageType } from "konva/lib/Stage";
// import type { Layer as LayerType } from "konva/lib/Layer";

const OVERLAY_CANVAS_ID = "overlay-canvas";
const FONT_SIZE = 14;
const LINE_HEIGHT = Math.floor(FONT_SIZE * 1.2);
const VERTICAL_PADDING = 4;
const HORIZONTAL_PADDING = 6;
const SCROLLBAR_WIDTH = 6;

const HEIGHT = Math.floor(LINE_HEIGHT + VERTICAL_PADDING * 1.5);

const FILL_COLOR = "rgb(239, 117, 65)";
const TEXT_COLOR = "rgb(255, 255, 255)";

const OverlayCanvasContainer = (props: {
  canvasWidth: number;
  containerRef: React.RefObject<HTMLDivElement>;
  parentRef: React.RefObject<HTMLDivElement>;
}) => {
  const selectedWidgetsData:
    | { id: string; widgetName: string; position: any }[]
    | undefined = useSelector(getPositionOfSelectedWidget);
  const canvasRef = useRef<HTMLDivElement>(null);

  const widgetNamePositions = useRef<
    | { left: number; top: number; height: number; text: string; width: number }
    | undefined
  >(undefined);

  const canvasPositions = useRef<{
    top: number;
    left: number;
    xDiff: number;
    width: number;
    yDiff: number;
  }>({
    top: 0,
    left: 0,
    xDiff: 0,
    width: 0,
    yDiff: 0,
  });
  const canvasPositionUpdated = useRef<boolean>(false);
  const containerEventAdded = useRef<boolean>(false);

  const scrollTop = useRef<number>(0);
  const isScrolling = useRef(0);
  const hasScroll = useRef<boolean>(false);
  const stageRef = useRef<any>(null);

  const { selectWidget } = useWidgetSelection();

  useEffect(() => {
    if (!canvasRef?.current) return;
    if (canvasPositionUpdated.current) return;
    const canvas: HTMLDivElement = canvasRef?.current as HTMLDivElement;
    const rect: DOMRect = canvas.getBoundingClientRect();
    if (rect) {
      canvasPositions.current = {
        ...canvasPositions.current,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      };
      canvasPositionUpdated.current = true;
    }
  }, [canvasRef?.current]);

  useEffect(() => {
    if (
      !props.containerRef?.current ||
      !props.parentRef?.current ||
      !canvasRef?.current ||
      containerEventAdded.current
    )
      return;
    const canvas: HTMLDivElement = canvasRef?.current as HTMLDivElement;
    const container: HTMLDivElement = props.containerRef
      ?.current as HTMLDivElement;
    const parent: HTMLDivElement = props.parentRef?.current as HTMLDivElement;
    const parentRect: DOMRect = parent.getBoundingClientRect();
    canvasPositions.current = {
      ...canvasPositions.current,
      xDiff: Math.abs(parentRect.left - canvasPositions.current.left),
      yDiff: Math.abs(parentRect.top - canvasPositions.current.top),
    };
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
    }, 20);
    const handleScroll = () => {
      if (!props.parentRef?.current) return;
      const currentScrollTop: number = props.parentRef?.current?.scrollTop;
      if (!isScrolling.current) {
        resetCanvas();
      }
      clearTimeout(isScrolling.current);
      isScrolling.current = setTimeout(() => {
        scrollTop.current = currentScrollTop;
        updateWNCPosition();
        isScrolling.current = 0;
        if (
          (props.parentRef?.current?.scrollHeight || 0) >
          (props.parentRef?.current?.clientHeight || 0)
        )
          hasScroll.current = true;
      }, 100);
    };
    container.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("scroll", handleScroll);
    containerEventAdded.current = true;
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("scroll", handleScroll);
      containerEventAdded.current = false;
    };
  }, [props.containerRef?.current, props.parentRef?.current]);

  const isMouseOver = (e: any) => {
    const x =
      e.clientX - canvasPositions.current.left - canvasPositions.current.xDiff;
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
    if (!selectedWidgetsData?.length) {
      resetCanvas();
      return;
    }
    updateWNCPosition();
  }, [selectedWidgetsData]);

  const updateWNCPosition = () => {
    if (!selectedWidgetsData?.length || !stageRef?.current) return;
    const selectedWidget = selectedWidgetsData[0];
    const { position, widgetName: text } = selectedWidget;
    if (!position) return;

    const textEl = new Konva.Text({
      fill: TEXT_COLOR,
      fontFamily: "sans-serif",
      fontSize: FONT_SIZE,
      text,
      x: HORIZONTAL_PADDING,
      y: VERTICAL_PADDING,
    });

    const textWidth: number = textEl.width();
    const componentWidth: number = textWidth + HORIZONTAL_PADDING * 2;
    const left: number =
      position.left +
      position.width -
      componentWidth -
      (hasScroll.current ? SCROLLBAR_WIDTH / 2 : 0);
    const top: number =
      position.top + canvasPositions.current.yDiff - HEIGHT - scrollTop.current;
    widgetNamePositions.current = {
      left: left,
      text,
      top: top,
      width: componentWidth,
      height: HEIGHT,
    };

    const stage = stageRef.current;
    const layer = stage.getLayers()[0];
    layer.destroyChildren();

    const groupEl = new Konva.Group({
      height: HEIGHT,
      width: componentWidth,
      x: left,
      y: top,
    });

    const rectEl = new Konva.Rect({
      cornerRadius: [4, 4, 0, 0],
      fill: FILL_COLOR,
      height: HEIGHT,
      width: componentWidth,
      x: 0,
      y: 0,
    });

    groupEl.on("click", (event) => {
      console.log("#### click", event);
      selectWidget(SelectionRequestType.One, [selectedWidget.id]);
    });

    groupEl.add(rectEl);
    groupEl.add(textEl);
    layer.add(groupEl);
    layer.draw();
  };

  const resetCanvas = () => {
    widgetNamePositions.current = undefined;
    const stage = stageRef.current;
    if (!stage) return;
    const layer = stage.getLayers()[0];
    if (!layer) return;
    layer.destroyChildren();
    layer.draw();
  };

  return (
    <div
      id={OVERLAY_CANVAS_ID}
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <Stage height={600} ref={stageRef} width={props.canvasWidth}>
        <Layer />
      </Stage>
    </div>
  );
};

export default OverlayCanvasContainer;
