import store from "store";
import { getSelectedWidgets } from "selectors/ui";
import { useMemo } from "react";

const FONT_SIZE = 16;
const VERTICAL_PADDING = 3;
const HORIZONTAL_PADDING = 5;

export const DRAG_IMAGE_HEIGHT = FONT_SIZE + VERTICAL_PADDING * 2;

const HORIZONTAL_OFFSET = 15;

export const useDragImageGenerator = () => {
  const getWidgetDragImage = (widgetText: string, forceText = false) => {
    const selectedWidgets = getSelectedWidgets(store.getState());
    const textToBeShown =
      selectedWidgets.length > 1 && !forceText
        ? `${selectedWidgets.length} widgets`
        : widgetText;

    const canvas = document.getElementById(
      "widget-drag-image",
    ) as HTMLCanvasElement;
    const context = canvas?.getContext("2d");

    if (context) {
      const { devicePixelRatio: scale = 2 } = window;

      context.scale(scale, scale);

      context.font = `500 ${FONT_SIZE}px sans-serif`;
      const textWidth = context.measureText(textToBeShown).width;
      const canvasWidth =
        HORIZONTAL_OFFSET + HORIZONTAL_PADDING * 2 + textWidth;

      canvas.width = canvasWidth * scale;
      canvas.height = DRAG_IMAGE_HEIGHT * scale;

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvasWidth, DRAG_IMAGE_HEIGHT);
      context.textBaseline = "top";

      context.fillStyle = "#4c5664";
      context.fillRect(0, 0, HORIZONTAL_OFFSET, DRAG_IMAGE_HEIGHT);

      context.font = `500 ${FONT_SIZE}px sans-serif`;
      context.fillText(
        textToBeShown,
        HORIZONTAL_OFFSET + HORIZONTAL_PADDING,
        VERTICAL_PADDING,
      );
    }

    return canvas;
  };

  const resetCanvas = () => {
    const canvas = document.getElementById(
      "widget-drag-image",
    ) as HTMLCanvasElement;
    const context = canvas?.getContext("2d");
    context?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const returnValue = useMemo(() => {
    return { getWidgetDragImage, resetCanvas };
  }, []);

  return returnValue;
};
