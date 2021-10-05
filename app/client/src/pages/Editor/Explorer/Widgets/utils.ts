import { ExplorerURLParams } from "../helpers";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";

export const navigateToCanvas = (
  params: ExplorerURLParams,
  currentPath: string,
  widgetPageId: string,
  widgetId: string,
) => {
  const canvasEditorURL = `${BUILDER_PAGE_URL(
    params.applicationId,
    widgetPageId,
  )}`;
  if (currentPath !== canvasEditorURL) {
    history.push(`${canvasEditorURL}#${widgetId}`);
  }
};
