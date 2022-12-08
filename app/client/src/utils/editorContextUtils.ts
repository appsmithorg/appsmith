import { Plugin } from "api/PluginApi";
import { PluginPackageName } from "entities/Action";
import {
  AuthenticationStatus,
  AuthType,
  Datasource,
} from "entities/Datasource";

/**
 * Append PageId to path and return the key
 * @param path
 * @param currentPageId
 * @returns
 */
export function generatePropertyKey(
  path: string | undefined,
  currentPageId: string,
) {
  if (!path) return;

  return `Page[${currentPageId}].${path}`;
}

/**
 * This method returns boolean if the propertyControl is focused.
 * @param domElement
 * @returns
 */
export function shouldFocusOnPropertyControl(
  domElement?: HTMLDivElement | null,
) {
  const isCurrentFocusOnInput =
    ["input", "textarea"].indexOf(
      document.activeElement?.tagName?.toLowerCase() || "",
    ) >= 0;

  let isCurrentFocusOnProperty = false;

  if (domElement) {
    isCurrentFocusOnProperty = domElement.contains(document.activeElement);
  }

  return !(isCurrentFocusOnInput || isCurrentFocusOnProperty);
}

/**
 * Returns a focusable field of PropertyCintrol.
 * @param element
 * @returns
 */
export function getPropertyControlFocusElement(
  element: HTMLDivElement | null,
): HTMLElement | undefined {
  return element?.children?.[1]?.querySelector(
    'button:not([tabindex="-1"]), input, [tabindex]:not([tabindex="-1"])',
  ) as HTMLElement | undefined;
}

/**
 * Returns true if :
 * - authentication type is not oauth2
 * - authentication type is oauth2 and authorized status success
 * @param element
 * @returns
 */
export function isDatasourceAuthorizedForQueryCreation(
  datasource: Datasource,
  plugin: Plugin,
): boolean {
  if (!datasource) return false;
  const authType =
    datasource &&
    datasource?.datasourceConfiguration?.authentication?.authenticationType;

  /* 
    TODO: This flag will be removed once the multiple environment is merged to avoid design inconsistency between different datasources.
    Search for: GoogleSheetPluginFlag to check for all the google sheet conditional logic throughout the code.
  */
  const isGoogleSheetPlugin =
    plugin.packageName === PluginPackageName.GOOGLE_SHEETS;
  if (isGoogleSheetPlugin && authType === AuthType.OAUTH2) {
    const isAuthorized =
      datasource?.datasourceConfiguration?.authentication
        ?.authenticationStatus === AuthenticationStatus.SUCCESS;
    return isAuthorized;
  }

  return true;
}
