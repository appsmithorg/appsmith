import type { Plugin } from "api/PluginApi";
import {
  DATASOURCE_DB_FORM,
  DATASOURCE_REST_API_FORM,
  DATASOURCE_SAAS_FORM,
} from "@appsmith/constants/forms";
import { getCurrentEnvironment } from "@appsmith/utils/Environments";
import { diff } from "deep-diff";
import { PluginPackageName, PluginType } from "entities/Action";
import type { Datasource } from "entities/Datasource";
import { AuthenticationStatus, AuthType } from "entities/Datasource";
import { get, isArray } from "lodash";
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
  const currentEnvironment = getCurrentEnvironment();
  if (!datasource) return false;
  const authType = get(
    datasource,
    `datasourceStorages.${currentEnvironment}.datasourceConfiguration.authentication.authenticationType`,
  );

  const isGoogleSheetPlugin = isGoogleSheetPluginDS(plugin?.packageName);
  if (isGoogleSheetPlugin) {
    const isAuthorized =
      authType === AuthType.OAUTH2 &&
      get(
        datasource,
        `datasourceStorages.${currentEnvironment}.datasourceConfiguration.authentication.authenticationStatus`,
      ) === AuthenticationStatus.SUCCESS;
    return isAuthorized;
  }

  return true;
}

/**
 * Determines whether plugin is google sheet or not
 * @param pluginPackageName string
 * @returns boolean
 */
export function isGoogleSheetPluginDS(pluginPackageName?: string) {
  return pluginPackageName === PluginPackageName.GOOGLE_SHEETS;
}

/**
 * Returns datasource property value from datasource?.datasourceConfiguration?.properties
 * @param datasource Datasource
 * @param propertyKey string
 * @returns string | null
 */
export function getDatasourcePropertyValue(
  datasource: Datasource,
  propertyKey: string,
  currentEnvironment: string,
): string | null {
  if (!datasource) {
    return null;
  }

  const properties = get(
    datasource,
    `datasourceStorages.${currentEnvironment}.datasourceConfiguration.properties`,
  );
  if (!!properties && properties.length > 0) {
    const propertyObj = properties.find((prop) => prop.key === propertyKey);
    if (!!propertyObj) {
      return propertyObj.value;
    }
  }

  return null;
}

export function getFormName(plugin: Plugin): string {
  const pluginType = plugin?.type;
  if (!!pluginType) {
    switch (pluginType) {
      case PluginType.DB:
      case PluginType.REMOTE:
        return DATASOURCE_DB_FORM;
      case PluginType.SAAS:
        return DATASOURCE_SAAS_FORM;
      case PluginType.API:
        return DATASOURCE_REST_API_FORM;
    }
  }
  return DATASOURCE_DB_FORM;
}

export function getFormDiffPaths(initialValues: any, currentValues: any) {
  const difference = diff(initialValues, currentValues);
  const diffPaths: string[] = [];
  if (!!difference) {
    difference.forEach((diff) => {
      if (!!diff.path && isArray(diff.path)) {
        diffPaths.push(diff.path.join("."));
      }
    });
  }
  return diffPaths;
}
