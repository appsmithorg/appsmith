import Api from "api/Api";
import type { ApiResponse } from "api/types";

// Constants for session-related URL parameters
export const SESSION_TOKEN_PARAM = "sessionToken";
export const ORIGINAL_SESSION_ID_PARAM = "originalSessionId";
export const DELETE_SESSION_PARAM = "deleteSession";
export const SESSION_TRANSFER_PHASE_PARAM = "sessionTransferPhase";
export const CSRF_TOKEN_PARAM = "csrfToken";
export const TRANSFER_PHASE_PARAM = "transferPhase";
export const SOURCE_DOMAIN_PARAM = "sourceDomain";

/**
 * Validates a session token from the URL and sets up the session.
 * This is used during cross-domain session transfers.
 *
 * @returns A promise that resolves to true if the session was validated successfully
 */
export const validateSessionToken = async (): Promise<boolean> => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get(SESSION_TOKEN_PARAM);

    if (!sessionToken) {
      return false;
    }

    // Create a copy of URL parameters to forward to the validation endpoint
    const validationParams = new URLSearchParams(window.location.search);

    const validationUrl = `v1/session/validate?${validationParams.toString()}`;

    // Get the response from the API
    const response = (await Api.get(
      validationUrl,
    )) as unknown as ApiResponse<boolean>;

    // Check if the request was successful
    if (!response?.responseMeta?.success) {
      return false;
    }

    // Remove the session token and related parameters from the URL
    const url = new URL(window.location.href);

    url.searchParams.delete(SESSION_TOKEN_PARAM);
    url.searchParams.delete(ORIGINAL_SESSION_ID_PARAM);
    url.searchParams.delete(DELETE_SESSION_PARAM);
    url.searchParams.delete(SESSION_TRANSFER_PHASE_PARAM);
    url.searchParams.delete(CSRF_TOKEN_PARAM);
    url.searchParams.delete(TRANSFER_PHASE_PARAM);
    url.searchParams.delete(SOURCE_DOMAIN_PARAM);

    window.history.replaceState({}, "", url.toString());

    // The data field contains the boolean result directly
    return !!response.data;
  } catch (error) {
    return false;
  }
};
