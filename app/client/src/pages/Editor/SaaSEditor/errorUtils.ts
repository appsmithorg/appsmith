import type { Datasource } from "entities/Datasource";
import { AuthenticationStatus } from "entities/Datasource";
import { type Plugin, PluginPackageName } from "entities/Plugin";
import {
  createMessage,
  GSHEET_AUTHORISED_FILE_IDS_KEY,
  GSHEET_AUTHORIZATION_ERROR,
  GSHEET_FILES_NOT_SELECTED,
} from "ee/constants/messages";
import { getDatasourcePropertyValue } from "utils/editorContextUtils";
import { GOOGLE_SHEET_SPECIFIC_SHEETS_SCOPE } from "constants/Datasource";
import { get } from "lodash";

/**
 * Returns true if :
 * - google sheet datasource has specific sheets modality and authorised file list is empty
 * @param datasource Datasource
 * @param propertyKey string
 * @returns boolean
 */
export function isAuthorisedFilesEmptyGsheet(
  datasource: Datasource,
  propertyKey: string,
  currentEnvironment: string,
): boolean {
  const value = get(
    datasource,
    `datasourceStorages.${currentEnvironment}.datasourceConfiguration.authentication.scopeString`,
  );
  const scopeValue: string = value ? value : "";

  const authorisedFileIds = getDatasourcePropertyValue(
    datasource,
    propertyKey,
    currentEnvironment,
  );
  const authStatus = get(
    datasource,
    `datasourceStorages.${currentEnvironment}.datasourceConfiguration.authentication.authenticationStatus`,
  );
  const isAuthFailure =
    !!authStatus &&
    authStatus === AuthenticationStatus.FAILURE_FILE_NOT_SELECTED;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gapiLoadSuccess = (window as any).googleAPIsLoaded;

  return (
    !!authorisedFileIds &&
    authorisedFileIds.length === 0 &&
    scopeValue.includes(GOOGLE_SHEET_SPECIFIC_SHEETS_SCOPE) &&
    isAuthFailure &&
    !!gapiLoadSuccess
  );
}

/**
 * Returns true if :
 * - google sheet datasource error message
 * @param datasource Datasource
 * @param plugin Plugin
 * @returns string
 */
export function getDatasourceErrorMessage(
  datasource: Datasource,
  plugin: Plugin | undefined,
  currentEnvironment: string,
): string {
  if (!datasource) return "";

  let authErrorMessage = "";

  switch (plugin?.packageName) {
    case PluginPackageName.GOOGLE_SHEETS: {
      const authorisedFilesEmptyGsheet = isAuthorisedFilesEmptyGsheet(
        datasource,
        createMessage(GSHEET_AUTHORISED_FILE_IDS_KEY),
        currentEnvironment,
      );

      authErrorMessage = authorisedFilesEmptyGsheet
        ? GSHEET_FILES_NOT_SELECTED
        : GSHEET_AUTHORIZATION_ERROR;
      break;
    }
    default:
      break;
  }

  return authErrorMessage;
}
