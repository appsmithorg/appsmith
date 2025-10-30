import { APP_MODE } from "entities/App";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { splitPathPreview } from "utils/helpers";
import { matchPath } from "react-router";
import { VIEWER_PATH_STATIC } from "constants/routes";

// Custom splitPathPreview function specifically for static URL paths
const splitPathPreviewForStaticUrl = (url: string): string | string[] => {
  const staticUrlMatch = matchPath<{
    staticApplicationSlug: string;
    staticPageSlug: string;
  }>(url, VIEWER_PATH_STATIC);

  if (staticUrlMatch?.isExact) {
    const { staticApplicationSlug, staticPageSlug } = staticUrlMatch.params;

    // Split at the actual page slug position, not just the text
    const appPart = `/app/${staticApplicationSlug}/`;
    const pagePart = staticPageSlug;

    return [appPart, pagePart];
  }

  return url;
};

export const getUrlPreview = (
  pageId: string,
  newPageName: string,
  currentPageName: string,
  applicationUniqueSlug: string,
  newCustomSlug?: string,
  currentCustomSlug?: string,
  isStaticUrlEnabled?: boolean,
  newStaticPageSlug?: string,
  currentPageSlug?: string,
) => {
  let relativePath: string;

  newPageName = filterAccentedAndSpecialCharacters(newPageName);
  currentPageName = filterAccentedAndSpecialCharacters(currentPageName);
  newCustomSlug &&
    (newCustomSlug = filterAccentedAndSpecialCharacters(newCustomSlug));
  currentCustomSlug &&
    (currentCustomSlug = filterAccentedAndSpecialCharacters(currentCustomSlug));
  newStaticPageSlug &&
    (newStaticPageSlug = filterAccentedAndSpecialCharacters(newStaticPageSlug));
  currentPageSlug &&
    (currentPageSlug = filterAccentedAndSpecialCharacters(currentPageSlug));

  // when static URL is enabled
  if (isStaticUrlEnabled) {
    // Determine the page slug to use: newStaticPageSlug if user has typed something, otherwise currentPageSlug
    const pageSlugToUse = newStaticPageSlug || currentPageSlug;

    // Generate static URL preview using application uniqueSlug and page slug
    relativePath = urlBuilder.getStaticUrlPathPreviewWithSlugs(
      applicationUniqueSlug,
      pageSlugToUse || newPageName,
    );

    return {
      relativePath,
      splitRelativePath: splitPathPreviewForStaticUrl(relativePath),
    };
  }

  // when page name is changed
  // and when custom slug doesn't exist
  if (!newCustomSlug && newPageName !== currentPageName) {
    // show path based on page name
    relativePath = urlBuilder.getPagePathPreview(pageId, newPageName);
  }
  // when custom slug is changed
  else if (newCustomSlug !== currentCustomSlug) {
    if (newCustomSlug) {
      // show custom slug preview
      relativePath = urlBuilder.getCustomSlugPathPreview(pageId, newCustomSlug);
    } else {
      // when custom slug is removed
      // show path based on page name
      relativePath = urlBuilder.getPagePathPreview(pageId, newPageName);
    }
  }
  // when nothing has changed
  else {
    relativePath = urlBuilder.generateBasePath(pageId, APP_MODE.PUBLISHED);
  }

  return {
    relativePath,
    splitRelativePath: splitPathPreview(relativePath, newCustomSlug),
  };
};

export const filterAccentedAndSpecialCharacters = (value: string) => {
  return decodeURI(value)
    .replaceAll(" ", "-")
    .replaceAll(/[^A-Za-z0-9-]/g, "");
};
