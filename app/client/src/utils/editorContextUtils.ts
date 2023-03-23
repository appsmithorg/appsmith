import type { Plugin } from "api/PluginApi";
import { PluginPackageName } from "entities/Action";
import type { Datasource } from "entities/Datasource";
import { AuthenticationStatus, AuthType } from "entities/Datasource";
export function isCurrentFocusOnInput() {
  return (
    ["input", "textarea"].indexOf(
      document.activeElement?.tagName?.toLowerCase() || "",
    ) >= 0
  );
}

/**
 * This method returns boolean if the propertyControl is focused.
 * @param domElement
 * @returns
 */
export function shouldFocusOnPropertyControl(
  domElement?: HTMLDivElement | null,
) {
  let isCurrentFocusOnProperty = false;

  if (domElement) {
    isCurrentFocusOnProperty = domElement.contains(document.activeElement);
  }

  return !(isCurrentFocusOnInput() || isCurrentFocusOnProperty);
}

/**
 * Returns a focusable field of PropertyControl.
 * @param element
 * @returns
 */
export function getPropertyControlFocusElement(
  element: HTMLDivElement | null,
): HTMLElement | undefined {
  if (element?.children) {
    const [, propertyInputElement] = element.children;

    if (propertyInputElement) {
      const uiInputElement = propertyInputElement.querySelector(
        'button:not([tabindex="-1"]), input, [tabindex]:not([tabindex="-1"])',
      ) as HTMLElement | undefined;
      if (uiInputElement) {
        return uiInputElement;
      }
      const codeEditorInputElement =
        propertyInputElement.getElementsByClassName("CodeEditorTarget")[0] as
          | HTMLElement
          | undefined;
      if (codeEditorInputElement) {
        return codeEditorInputElement;
      }

      const lazyCodeEditorInputElement =
        propertyInputElement.getElementsByClassName("LazyCodeEditor")[0] as
          | HTMLElement
          | undefined;
      if (lazyCodeEditorInputElement) {
        return lazyCodeEditorInputElement;
      }
    }
  }
}

/**
 * Returns true if :
 * - authentication type is not oauth2 or is not a Google Sheet Plugin
 * - authentication type is oauth2 and authorized status success and is a Google Sheet Plugin
 * @param datasource Datasource
 * @param plugin Plugin
 * @returns boolean
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
