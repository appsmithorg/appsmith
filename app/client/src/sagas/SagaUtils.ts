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
