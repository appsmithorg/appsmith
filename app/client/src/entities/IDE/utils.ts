import { matchPath } from "react-router";
import { BUILDER_PATH } from "../../constants/routes";
import { AppState } from "./constants";

export function getCurrentAppState(currentUrl: string): AppState {
  const match = matchPath<{
    appState?: "datasource" | "settings" | "libraries";
  }>(currentUrl, {
    path: `${BUILDER_PATH}/:appState`,
  });

  if (match && match.params.appState) {
    const { appState } = match.params;
    if (appState === "datasource") {
      return AppState.DATA;
    } else if (appState === "settings") {
      return AppState.SETTINGS;
    } else if (appState === "libraries") {
      return AppState.LIBRARIES;
    } else {
      return AppState.PAGES;
    }
  }
  return AppState.PAGES;
}
