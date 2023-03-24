import { noop } from "lodash";
import nanoid from "nanoid";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { FALLBACK_KEY } from "./constants";

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

export const updateAnonymousID = (
  data: Record<string, unknown>,
  isTelemetryEnabled: boolean,
  isAnonymousUser: boolean,
) => {
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
