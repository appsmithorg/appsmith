import Api from "api/Api";
import type { ApiResponse } from "api/types";

export const SESSION_TOKEN_PARAM = "sessionToken";

/**
 * Validates a session token from the URL and sets up the session.
 * This is used during cross-domain session transfers.
 *
 * @returns A promise that resolves to true if the session was validated successfully
 */
export const validateSessionToken = async (): Promise<boolean> => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get("sessionToken");

    if (!sessionToken) {
      return false;
    }

    // Get the response from the API
    const response = (await Api.get(
      `v1/session/validate?sessionToken=${sessionToken}`,
    )) as unknown as ApiResponse<boolean>;

    // Check if the request was successful
    if (!response?.responseMeta?.success) {
      return false;
    }

    // Remove the session token from the URL
    const url = new URL(window.location.href);

    url.searchParams.delete("sessionToken");
    window.history.replaceState({}, "", url.toString());

    // The data field contains the boolean result directly
    return !!response.data;
  } catch (error) {
    return false;
  }
};
