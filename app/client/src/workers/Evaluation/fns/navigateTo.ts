import { promisify } from "./utils/Promisify";

export enum NavigationTargetType {
  SAME_WINDOW = "SAME_WINDOW",
  NEW_WINDOW = "NEW_WINDOW",
}

/**
 * Navigates to a page, URL, or application
 * @param pageNameOrUrl - Name of the page or URL to navigate to
 * @param params - Query parameters for the navigation
 * @param target - Target window for navigation (same window or new window)
 * @param appName - Optional name of the application to navigate to
 */
function navigateToFnDescriptor(
  pageNameOrUrl: string,
  params: Record<string, string> = {},
  target = NavigationTargetType.SAME_WINDOW,
  appName?: string,
) {
  return {
    type: "NAVIGATE_TO" as const,
    payload: { pageNameOrUrl, params, target, appName },
  };
}

export type TNavigateToArgs = Parameters<typeof navigateToFnDescriptor>;
export type TNavigateToDescription = ReturnType<typeof navigateToFnDescriptor>;
export type TNavigateToActionType = TNavigateToDescription["type"];

// Helper type for the payload
export type TNavigateToPayload = TNavigateToDescription["payload"];

async function navigateTo(...args: Parameters<typeof navigateToFnDescriptor>) {
  return promisify(navigateToFnDescriptor)(...args);
}

export default navigateTo;
