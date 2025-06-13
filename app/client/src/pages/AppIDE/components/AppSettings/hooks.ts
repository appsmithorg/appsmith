import { APP_MODE } from "entities/App";
import urlBuilder from "ee/entities/URLRedirect/URLAssembly";
import { splitPathPreview } from "utils/helpers";
import { filterAccentedAndSpecialCharacters } from "./utils";
import { useMemo } from "react";

export const useUrlPreview = (
  basePageId: string,
  newPageName: string,
  currentPageName: string,
  newCustomSlug?: string,
  currentCustomSlug?: string,
) => {
  return useMemo(() => {
    let relativePath: string;
    const filteredNewPageName = filterAccentedAndSpecialCharacters(newPageName);
    const filteredCurrentPageName =
      filterAccentedAndSpecialCharacters(currentPageName);
    const filteredNewCustomSlug = newCustomSlug
      ? filterAccentedAndSpecialCharacters(newCustomSlug)
      : undefined;
    const filteredCurrentCustomSlug = currentCustomSlug
      ? filterAccentedAndSpecialCharacters(currentCustomSlug)
      : undefined;

    // when page name is changed
    // and when custom slug doesn't exist
    if (
      !filteredNewCustomSlug &&
      filteredNewPageName !== filteredCurrentPageName
    ) {
      // show path based on page name
      relativePath = urlBuilder.getPagePathPreview(
        basePageId,
        filteredNewPageName,
      );
    }
    // when custom slug is changed
    else if (filteredNewCustomSlug !== filteredCurrentCustomSlug) {
      if (filteredNewCustomSlug) {
        // show custom slug preview
        relativePath = urlBuilder.getCustomSlugPathPreview(
          basePageId,
          filteredNewCustomSlug,
        );
      } else {
        // when custom slug is removed
        // show path based on page name
        relativePath = urlBuilder.getPagePathPreview(
          basePageId,
          filteredNewPageName,
        );
      }
    }
    // when nothing has changed
    else {
      relativePath = urlBuilder.generateBasePath(
        basePageId,
        APP_MODE.PUBLISHED,
      );
    }

    return {
      relativePath,
      splitRelativePath: splitPathPreview(relativePath, filteredNewCustomSlug),
    };
  }, [
    basePageId,
    currentCustomSlug,
    currentPageName,
    newCustomSlug,
    newPageName,
  ]);
};
