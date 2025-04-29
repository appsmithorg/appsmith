import store from "store";
import type { AxiosError } from "axios";
import { is404orAuthPath } from "api/helpers";
import { logoutUser } from "actions/userActions";
import { AUTH_LOGIN_URL } from "constants/routes";
import { API_STATUS_CODES, ERROR_CODES } from "ee/constants/ApiConstants";
import { appsmithTelemetry } from "instrumentation";

export const handleUnauthorizedError = async (error: AxiosError) => {
  if (is404orAuthPath()) return null;

  if (error.response?.status === API_STATUS_CODES.REQUEST_NOT_AUTHORISED) {
    const currentUrl = `${window.location.href}`;

    store.dispatch(
      logoutUser({
        redirectURL: `${AUTH_LOGIN_URL}?redirectUrl=${encodeURIComponent(
          currentUrl,
        )}`,
      }),
    );

    appsmithTelemetry.captureException(error, {
      errorName: "UnauthorizedError",
    });

    return Promise.reject({
      ...error,
      code: ERROR_CODES.REQUEST_NOT_AUTHORISED,
      message: "Unauthorized. Redirecting to login page...",
      show: false,
    });
  }

  return null;
};
