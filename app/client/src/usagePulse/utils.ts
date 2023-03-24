import { isEditorPath } from "ce/pages/Editor/Explorer/helpers";
import { APP_MODE } from "entities/App";
import { isNil, noop } from "lodash";
import nanoid from "nanoid";
import { getAppMode } from "selectors/entitiesSelector";
import store from "store";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { FALLBACK_KEY } from "./constants";

//todo:Return a promise
export const fetchWithRetry = (
  url: string,
  data: object,
  retries: number,
  retryTimeout: number,
) => {
  fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) throw new Error();
    })
    .catch(() => {
      if (retries > 0) {
        setTimeout(fetchWithRetry, retryTimeout, url, data, retries - 1);
      } else throw noop;
    });
};

export const getUsagePulsePayload = (
  isTelemetryEnabled: boolean,
  isAnonymousUser: boolean,
) => {
  let mode = getAppMode(store.getState());

  if (isNil(mode)) {
    mode = isEditorPath(window.location.pathname)
      ? APP_MODE.EDIT
      : APP_MODE.PUBLISHED;
  }

  const data: Record<string, unknown> = {
    viewMode: mode === APP_MODE.PUBLISHED,
  };
  if (isAnonymousUser) {
    if (isTelemetryEnabled) {
      data["anonymousUserId"] = AnalyticsUtil.getAnonymousId();
    } else {
      let fallback = localStorage.getItem(FALLBACK_KEY);
      if (!fallback) {
        fallback = nanoid() as string;
        localStorage.setItem(FALLBACK_KEY, fallback);
      }
      data["anonymousUserId"] = fallback;
    }
  }
  return data;
};
