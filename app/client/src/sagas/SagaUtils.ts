import { ApplicationPagePayload } from "api/ApplicationApi";
export const getDefaultPageId = (
  pages?: ApplicationPagePayload[],
): string | undefined => {
  let defaultPage: ApplicationPagePayload | undefined = undefined;
  if (pages) {
    defaultPage = pages.find(page => page.isDefault);
    if (!defaultPage) {
      defaultPage = pages[0];
    }
  }
  return defaultPage ? defaultPage.id : undefined;
};

export enum EVAL_WORKER_ACTIONS {
  EVAL_TREE = "EVAL_TREE",
  EVAL_SINGLE = "EVAL_SINGLE",
  CLEAR_PROPERTY_CACHE = "CLEAR_PROPERTY_CACHE",
  CLEAR_CACHE = "CLEAR_CACHE",
}
