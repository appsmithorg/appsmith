import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";

export const navigateToCanvas = (
  currentPath: string,
  widgetPageId: string,
  widgetId: string,
  defaultApplicationId: string,
) => {
  const canvasEditorURL = `${BUILDER_PAGE_URL(
    defaultApplicationId,
    widgetPageId,
  )}`;
  if (currentPath !== canvasEditorURL) {
    history.push(`${canvasEditorURL}#${widgetId}`);
  }
};
