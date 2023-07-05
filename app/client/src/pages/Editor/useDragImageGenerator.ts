import store from "store";
import { getSelectedWidgets } from "selectors/ui";
import { useMemo } from "react";

const FONT_SIZE = 14;
const VERTICAL_PADDING = 3;
const HORIZONTAL_PADDING = 3;

const HEIGHT = FONT_SIZE + VERTICAL_PADDING * 2;

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
      context.font = `400 ${FONT_SIZE}px sans-serif`;
      const textWidth = context.measureText(textToBeShown).width;
      const canvasWidth =
        HORIZONTAL_OFFSET + HORIZONTAL_PADDING * 2 + textWidth;

      canvas.width = canvasWidth;
      canvas.height = HEIGHT;

      context.fillStyle = "#eeeeee";
      context.fillRect(0, 0, canvasWidth, HEIGHT);
      context.textBaseline = "top";

      context.fillStyle = "#4c5664";
      context.fillRect(0, 0, HORIZONTAL_OFFSET, HEIGHT);

      context.font = `400 ${FONT_SIZE}px sans-serif`;
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
