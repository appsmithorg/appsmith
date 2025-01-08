import type { Plugin } from "api/PluginApi.types";
import {
  DATASOURCE_DB_FORM,
  DATASOURCE_REST_API_FORM,
  DATASOURCE_SAAS_FORM,
} from "ee/constants/forms";
import { DB_NOT_SUPPORTED } from "ee/utils/Environments";
import { diff } from "deep-diff";
import { PluginName, PluginPackageName, PluginType } from "entities/Action";
import type {
  Datasource,
  DatasourceStructure,
  DatasourceTable,
  QueryTemplate,
} from "entities/Datasource";
import { AuthenticationStatus, AuthType } from "entities/Datasource";
import { get, isArray } from "lodash";
import store from "store";
import { getPlugin } from "ee/selectors/entitiesSelector";
import type { AppState } from "ee/reducers";
import {
  DATASOURCES_ALLOWED_FOR_PREVIEW_MODE,
  MOCK_DB_TABLE_NAMES,
  SQL_DATASOURCES,
} from "constants/QueryEditorConstants";
import {
  NOSQL_PLUGINS_DEFAULT_TEMPLATE_TYPE,
  SQL_PLUGINS_DEFAULT_TEMPLATE_TYPE,
} from "constants/Datasource";
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
  element: HTMLElement | null,
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
 * @param currentEnvironment string
 * @param validStatusArr Array<AuthenticationStatus>
 * @returns boolean
 */
export function isDatasourceAuthorizedForQueryCreation(
  datasource: Datasource,
  plugin: Plugin,
  currentEnvironment: string,
  validStatusArr: Array<AuthenticationStatus> = [AuthenticationStatus.SUCCESS],
): boolean {
  if (!datasource || !datasource.hasOwnProperty("datasourceStorages"))
    return false;

  const isGoogleSheetPlugin = isGoogleSheetPluginDS(plugin?.packageName);
  const envSupportedDs = !DB_NOT_SUPPORTED.includes(plugin?.type || "");

  if (!datasource.datasourceStorages.hasOwnProperty(currentEnvironment)) {
    if (envSupportedDs) return false;

    const envs = Object.keys(datasource.datasourceStorages);

    if (envs.length === 0) return false;

    currentEnvironment = envs[0];
  }

  const datasourceStorage = datasource.datasourceStorages[currentEnvironment];

  if (
    !datasourceStorage ||
    !datasourceStorage.hasOwnProperty("id") ||
    !datasourceStorage.hasOwnProperty("datasourceConfiguration")
  )
    return false;

  const authType = get(
    datasourceStorage,
    "datasourceConfiguration.authentication.authenticationType",
  );

  if (isGoogleSheetPlugin) {
    const authStatus = get(
      datasourceStorage,
      "datasourceConfiguration.authentication.authenticationStatus",
    ) as AuthenticationStatus;
    const isAuthorized =
      authType === AuthType.OAUTH2 &&
      !!authStatus &&
      validStatusArr.includes(authStatus);

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
      case PluginType.AI:
        return DATASOURCE_DB_FORM;
      case PluginType.SAAS:
        return DATASOURCE_SAAS_FORM;
      case PluginType.API:
        return DATASOURCE_REST_API_FORM;
    }
  }

  return DATASOURCE_DB_FORM;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 * Returns mock datasource default table name to be populated in query editor, based on plugin name
 * @param pluginId string
 * @returns string
 */
export function getSQLPluginsMockTableName(pluginId: string) {
  const state: AppState = store.getState();
  const plugin: Plugin | undefined = getPlugin(state, pluginId);

  switch (plugin?.name) {
    case PluginName.POSTGRES: {
      return "public.users";
    }
    default: {
      return "";
    }
  }
}

export function getDefaultTemplateActionConfig(
  plugin: Plugin,
  dsPreviewTable?: string,
  dsStructure?: DatasourceStructure,
  isMock?: boolean,
) {
  if (!!dsStructure) {
    let defaultTableName = "";
    let templateTitle = "";
    let queryTemplate: QueryTemplate | undefined = undefined;

    if (SQL_DATASOURCES.includes(plugin?.name)) {
      templateTitle = SQL_PLUGINS_DEFAULT_TEMPLATE_TYPE;
    } else if (plugin?.name === PluginName.MONGO) {
      templateTitle = NOSQL_PLUGINS_DEFAULT_TEMPLATE_TYPE;
    }

    if (isMock) {
      switch (plugin?.name) {
        case PluginName.MONGO: {
          defaultTableName = MOCK_DB_TABLE_NAMES.MOVIES;
          break;
        }
        case PluginName.POSTGRES: {
          defaultTableName = MOCK_DB_TABLE_NAMES.USERS;
          break;
        }
        default: {
          defaultTableName = "";
          break;
        }
      }
    } else {
      if (SQL_DATASOURCES.includes(plugin?.name)) {
        defaultTableName = !!dsPreviewTable
          ? dsPreviewTable
          : !!dsStructure.tables && dsStructure.tables.length > 0
            ? dsStructure.tables[0].name
            : "";
      }
    }

    const table: DatasourceTable | undefined = dsStructure.tables?.find(
      (table: DatasourceTable) => table.name === defaultTableName,
    );

    queryTemplate = table?.templates?.find(
      (template: QueryTemplate) => template.title === templateTitle,
    );

    // Reusing same functionality as QueryTemplate.tsx to populate actionConfiguration
    if (!!queryTemplate) {
      return {
        body: queryTemplate.body,
        pluginSpecifiedTemplates: queryTemplate.pluginSpecifiedTemplates,
        formData: queryTemplate.configuration,
        ...queryTemplate.actionConfiguration,
      };
    }

    return null;
  }
}

export const isEnabledForPreviewData = (
  datasource: Datasource,
  plugin: Plugin,
) => {
  const isGoogleSheetPlugin = isGoogleSheetPluginDS(plugin?.packageName);

  return (
    DATASOURCES_ALLOWED_FOR_PREVIEW_MODE.includes(plugin?.name || "") ||
    (plugin?.name === PluginName.MONGO &&
      !!(datasource as Datasource)?.isMock) ||
    isGoogleSheetPlugin
  );
};
