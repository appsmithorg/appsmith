import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";

export const navigateToCanvas = ({
  applicationSlug,
  pageId,
  pageSlug,
  widgetId,
}: {
  pageId: string;
  widgetId: string;
  applicationSlug: string;
  pageSlug: string;
}) => {
  const currentPath = window.location.pathname;
  const canvasEditorURL = `${BUILDER_PAGE_URL({
    applicationSlug,
    pageSlug,
    pageId,
    hash: widgetId,
  })}`;
  if (currentPath !== canvasEditorURL) {
    history.push(canvasEditorURL);
  }
};
