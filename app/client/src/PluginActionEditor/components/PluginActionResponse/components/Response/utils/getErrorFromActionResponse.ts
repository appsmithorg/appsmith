// Type imports
import type { ActionResponse } from "api/ActionAPI";

// Application-specific imports
import { PluginType } from "entities/Plugin";
import { DEFAULT_ERROR_MESSAGE } from "../constants";

/**
 * Checks if the plugin type is supported for detailed error handling
 */
const isSupportedPluginTypeForErrorDetails = (
  pluginType?: PluginType,
): boolean => {
  return (
    pluginType === PluginType.DB ||
    pluginType === PluginType.SAAS ||
    pluginType === PluginType.EXTERNAL_SAAS ||
    pluginType === PluginType.API
  );
};

/**
 * Retrieves the error message from the action response.
 * Returns a tuple of [errorTitle, errorMessage]
 */
export const getErrorMessageFromActionResponse = (
  actionResponse?: ActionResponse,
  pluginType?: PluginType,
) => {
  if (!actionResponse) {
    return [DEFAULT_ERROR_MESSAGE, DEFAULT_ERROR_MESSAGE];
  }

  const { body, pluginErrorDetails, statusCode } = actionResponse;

  // Determine base error message based on plugin type
  let errorMessage = isSupportedPluginTypeForErrorDetails(pluginType)
    ? body
    : DEFAULT_ERROR_MESSAGE;

  // Override with plugin-specific error details if available
  if (pluginErrorDetails) {
    errorMessage =
      pluginErrorDetails.downstreamErrorMessage ||
      pluginErrorDetails.appsmithErrorMessage;
  }

  // For API plugin types, use status code as the title
  const errorTitle = pluginType === PluginType.API ? statusCode : errorMessage;

  return [errorTitle, errorMessage];
};
