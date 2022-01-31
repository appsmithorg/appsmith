import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";

export const navigateToCanvas = ({
  applicationId,
  pageId,
  widgetId,
}: {
  pageId: string;
  widgetId: string;
  applicationId: string;
}) => {
  const currentPath = window.location.pathname;
  const canvasEditorURL = `${BUILDER_PAGE_URL({
    applicationId,
    pageId,
    hash: widgetId,
  })}`;
  if (currentPath !== canvasEditorURL) {
    history.push(canvasEditorURL);
  }
};
