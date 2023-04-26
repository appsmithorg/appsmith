import type { Datasource } from "entities/Datasource";
import { AuthenticationStatus } from "entities/Datasource";
import type { Plugin } from "api/PluginApi";
import {
  createMessage,
  GSHEET_AUTHORISED_FILE_IDS_KEY,
  GSHEET_AUTHORIZATION_ERROR,
  GSHEET_FILES_NOT_SELECTED,
} from "@appsmith/constants/messages";
import { getDatasourcePropertyValue } from "utils/editorContextUtils";
import { GOOGLE_SHEET_SPECIFIC_SHEETS_SCOPE } from "constants/Datasource";
import { PluginPackageName } from "entities/Action";

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
): boolean {
  const scopeValue: string = (
    datasource?.datasourceConfiguration?.authentication as any
  )?.scopeString;

  const authorisedFileIds = getDatasourcePropertyValue(datasource, propertyKey);
  const authStatus =
    datasource?.datasourceConfiguration?.authentication?.authenticationStatus;
  const isAuthFailure =
    !!authStatus && authStatus === AuthenticationStatus.FAILURE;

  return (
    !!authorisedFileIds &&
    authorisedFileIds.length === 0 &&
    scopeValue.includes(GOOGLE_SHEET_SPECIFIC_SHEETS_SCOPE) &&
    isAuthFailure
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
): string {
  if (!datasource) return "";

  let authErrorMessage = "";

  switch (plugin?.packageName) {
    case PluginPackageName.GOOGLE_SHEETS: {
      const authorisedFilesEmptyGsheet = isAuthorisedFilesEmptyGsheet(
        datasource,
        createMessage(GSHEET_AUTHORISED_FILE_IDS_KEY),
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
