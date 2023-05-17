import { builderURL } from "RouteBuilder";
import history from "utils/history";

export const navigateToCanvas = (pageId: string) => {
  const currentPath = window.location.pathname;
  const canvasEditorURL = `${builderURL({
    pageId,
    persistExistingParams: true,
  })}`;
  if (currentPath !== canvasEditorURL) {
    history.push(canvasEditorURL);
  }
};
