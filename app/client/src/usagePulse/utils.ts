import { isEditorPath } from "@appsmith/pages/Editor/Explorer/helpers";
import { APP_MODE } from "entities/App";
import { isNil, noop } from "lodash";
import nanoid from "nanoid";
import { getAppMode } from "selectors/entitiesSelector";
import store from "store";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { FALLBACK_KEY } from "@appsmith/constants/UsagePulse";

//TODO (Dipyaman): We should return a promise that will get resolved only on success or rejected after the retries
export const fetchWithRetry = (config: {
  url: any;
  payload: Record<string, unknown>;
  retries: number;
  retryTimeout: number;
}) => {
  fetch(config.url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config.payload),
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) throw new Error();
    })
    .catch(() => {
      if (config.retries > 0) {
        setTimeout(fetchWithRetry, config.retryTimeout, {
          url: config.url,
          payload: config.payload,
          retries: config.retries - 1,
          retryTimeout: config.retryTimeout,
        });
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
