import { promisify } from "./utils/Promisify";

export enum NavigationTargetType {
  SAME_WINDOW = "SAME_WINDOW",
  NEW_WINDOW = "NEW_WINDOW",
}

function navigateToFnDescriptor(
  pageNameOrUrl: string,
  params: Record<string, string>,
  target = NavigationTargetType.SAME_WINDOW,
) {
  return {
    type: "NAVIGATE_TO" as const,
    payload: { pageNameOrUrl, params, target },
  };
}

export type TNavigateToArgs = Parameters<typeof navigateToFnDescriptor>;
export type TNavigateToDescription = ReturnType<typeof navigateToFnDescriptor>;
export type TNavigateToActionType = TNavigateToDescription["type"];

async function navigateTo(...args: Parameters<typeof navigateToFnDescriptor>) {
  return promisify(navigateToFnDescriptor)(...args);
}

export default navigateTo;
