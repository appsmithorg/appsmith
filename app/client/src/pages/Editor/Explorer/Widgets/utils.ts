import { builderURL } from "RouteBuilder";
import history, { NavigationMethod } from "utils/history";

export const navigateToCanvas = (
  pageId: string,
  widgetId?: string,
  invokedBy?: NavigationMethod,
) => {
  const currentPath = window.location.pathname;
  const canvasEditorURL = `${builderURL({
    pageId,
    hash: widgetId,
    persistExistingParams: true,
  })}`;
  if (currentPath !== canvasEditorURL) {
    history.push(canvasEditorURL, { invokedBy });
  }
};
