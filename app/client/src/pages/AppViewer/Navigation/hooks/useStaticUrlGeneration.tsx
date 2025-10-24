import { useSelector } from "react-redux";
import { useHref } from "pages/Editor/utils";
import { builderURL, viewerURL } from "ee/RouteBuilder";
import {
  getAppMode,
  getCurrentApplication,
} from "ee/selectors/applicationSelectors";
import { getPageList } from "selectors/editorSelectors";
import { BUILDER_PATH_STATIC, VIEWER_PATH_STATIC } from "constants/routes";
import { APP_MODE } from "entities/App";

/**
 * Hook to generate URLs for navigation, supporting both static and regular URLs
 * @param basePageId - The base page ID to generate URL for
 * @param mode - The app mode (EDIT or PUBLISHED)
 * @returns The generated URL string
 */
export const useStaticUrlGeneration = (basePageId: string, mode?: APP_MODE) => {
  const appMode = useSelector(getAppMode);
  const currentApplication = useSelector(getCurrentApplication);
  const pages = useSelector(getPageList);

  // Check if static URLs are enabled for this application
  const isStaticUrlEnabled = currentApplication?.staticUrlEnabled;

  // Find the target page to get its uniqueSlug if static URLs are enabled
  const targetPage = pages.find((page) => page.basePageId === basePageId);

  // Always call useHref hook (React hooks must be called unconditionally)
  const regularURL = useHref(
    (mode || appMode) === APP_MODE.PUBLISHED ? viewerURL : builderURL,
    { basePageId },
  );

  if (isStaticUrlEnabled && targetPage?.uniqueSlug) {
    // Generate static URL using application and page slugs
    const staticPath =
      (mode || appMode) === APP_MODE.PUBLISHED
        ? VIEWER_PATH_STATIC
        : BUILDER_PATH_STATIC;

    return staticPath
      .replace(":staticApplicationSlug", currentApplication.uniqueSlug || "")
      .replace(":staticPageSlug", targetPage.uniqueSlug || "");
  }

  // Use regular URL generation
  return regularURL;
};

/**
 * Hook to generate viewer URLs specifically
 * @param basePageId - The base page ID to generate URL for
 * @returns The generated viewer URL string
 */
export const useViewerUrlGeneration = (basePageId: string) => {
  return useStaticUrlGeneration(basePageId, APP_MODE.PUBLISHED);
};

/**
 * Hook to generate builder URLs specifically
 * @param basePageId - The base page ID to generate URL for
 * @returns The generated builder URL string
 */
export const useBuilderUrlGeneration = (basePageId: string) => {
  return useStaticUrlGeneration(basePageId, APP_MODE.EDIT);
};

export default useStaticUrlGeneration;
