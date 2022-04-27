import { builderURL } from "RouteBuilder";
import history from "utils/history";

export const navigateToCanvas = ({
  pageId,
  widgetId,
}: {
  pageId: string;
  widgetId: string;
}) => {
  const currentPath = window.location.pathname;
  const canvasEditorURL = `${builderURL({
    pageId,
    hash: widgetId,
  })}`;
  if (currentPath !== canvasEditorURL) {
    history.push(canvasEditorURL);
  }
};
