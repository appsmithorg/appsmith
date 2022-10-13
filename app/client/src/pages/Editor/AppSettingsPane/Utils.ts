import { APP_MODE } from "entities/App";
import urlBuilder from "entities/URLRedirect/URLAssembly";
import { splitPathPreview } from "utils/helpers";

export const specialCharacterCheckRegex = /^[A-Za-z0-9\s\-]+$/;

export const getUrlPreview = (
  pageId: string,
  newPageName: string,
  currentPageName: string,
  newCustomSlug?: string,
  currentCustomSlug?: string,
) => {
  let pathPreview: string | string[];

  // when page name is changed
  // and when custom slug doesn't exist
  if (!newCustomSlug && newPageName !== currentPageName) {
    // show path based on page name
    pathPreview = urlBuilder.getPagePathPreview(pageId, newPageName);
  }
  // when custom slug is changed
  else if (newCustomSlug !== currentCustomSlug) {
    if (newCustomSlug) {
      // show custom slug preview
      pathPreview = urlBuilder.getCustomSlugPathPreview(pageId, newCustomSlug);
    } else {
      // when custom slug is removed
      // show path based on page name
      pathPreview = urlBuilder.getPagePathPreview(pageId, newPageName);
    }
  }
  // when nothing has changed
  else {
    pathPreview = urlBuilder.generateBasePath(pageId, APP_MODE.PUBLISHED);
  }

  return splitPathPreview(pathPreview, newCustomSlug);
};
