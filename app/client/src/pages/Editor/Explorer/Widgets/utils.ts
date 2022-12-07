import { builderURL } from "RouteBuilder";
import history from "utils/history";

export const navigateToCanvas = (pageId: string, widgetId?: string) => {
  const currentPath = window.location.pathname;
  const canvasEditorURL = `${builderURL({
    pageId,
    hash: widgetId,
    persistExistingParams: true,
  })}`;
  if (currentPath !== canvasEditorURL) {
    history.push(canvasEditorURL);
  }
};
