import type { ActionResponse } from "api/ActionAPI";
import { PluginType } from "entities/Plugin";
import { DEFAULT_ERROR_MESSAGE } from "../constants";

/**
 * Retrieves the error message from the action response.
 */
export const getErrorMessageFromActionResponse = (
  actionResponse?: ActionResponse,
  pluginType?: PluginType,
) => {
  // Return default error message if action response is not provided
  if (!actionResponse) return DEFAULT_ERROR_MESSAGE;

  const { body, pluginErrorDetails } = actionResponse;

  if (pluginErrorDetails) {
    // Return downstream error message if available
    // Otherwise, return Appsmith error message
    return (
      pluginErrorDetails.downstreamErrorMessage ||
      pluginErrorDetails.appsmithErrorMessage
    );
  }

  // Return body if plugin type is DB, otherwise return default error message
  return pluginType === PluginType.DB ? body : DEFAULT_ERROR_MESSAGE;
};
