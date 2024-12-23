import {
  deviceType,
  browserName,
  browserVersion,
  osName,
  osVersion,
} from "react-device-detect";
import nanoid from "nanoid";
import memoizeOne from "memoize-one";
import { getApplicationParamsFromUrl } from "ee/utils/serviceWorkerUtils";

const OTLP_SESSION_ID = nanoid();

const getAppParams = memoizeOne(
  (origin: string, pathname: string, search: string) => {
    const applicationParams = getApplicationParamsFromUrl({
      origin,
      pathname,
      search,
    });

    const {
      applicationSlug,
      appMode = "",
      basePageId: pageId,
      branchName,
    } = applicationParams || {};

    return {
      appMode,
      pageId,
      branchName,
      applicationSlug,
    };
  },
);

export const getCommonTelemetryAttributes = () => {
  const { origin, pathname, search } = window.location;
  const appParams = getAppParams(origin, pathname, search);

  return {
    ...appParams,
    deviceType,
    browserName,
    browserVersion,
    otlpSessionId: OTLP_SESSION_ID,
    hostname: window.location.hostname,
    osName,
    osVersion,
  };
};
