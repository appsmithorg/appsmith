import { isEditorPath } from "ee/pages/Editor/Explorer/helpers";
import { APP_MODE } from "entities/App";
import { isNil } from "lodash";
import { nanoid } from "nanoid";
import { getAppMode } from "ee/selectors/entitiesSelector";
import store from "store";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { FALLBACK_KEY } from "ee/constants/UsagePulse";
import { getInstanceId } from "ee/selectors/organizationSelectors";

//TODO (Dipyaman): We should return a promise that will get resolved only on success or rejected after the retries
export const fetchWithRetry = (config: {
  url: string;
  payload: Record<string, unknown>;
  retries: number;
  retryTimeout: number;
}) => {
  const instanceId = getInstanceId(store.getState());
  const anonymousUserId = AnalyticsUtil.getAnonymousId();

  fetch(config.url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-By": "Appsmith",
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
      } else {
        // add analytics for failed usage pulse
        AnalyticsUtil.logEvent("MALFORMED_USAGE_PULSE", {
          anonymousUserId,
          instanceId,
        });
      }
    });
};

/*
 * Returns usage-pulse's own anonymous id, independent of Segment analytics.
 * Persisted locally so the pulse keeps a stable id even when Segment is
 * unavailable or intentionally blocked for anonymous users.
 */
const getOrCreateFallbackAnonymousId = (): string => {
  try {
    let fallback = localStorage.getItem(FALLBACK_KEY);

    if (!fallback) {
      fallback = nanoid();
      localStorage.setItem(FALLBACK_KEY, fallback);
    }

    return fallback;
  } catch {
    /*
     * localStorage can throw when it is unavailable (private mode, quota
     * exceeded, or storage disabled). Return a non-persisted per-call id so
     * the pulse still carries an anonymousUserId instead of failing.
     */
    return nanoid();
  }
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
      /*
       * Prefer Segment's anonymous id when available, but fall back to the
       * locally persisted id when it is unavailable (e.g. Segment blocked for
       * anonymous users) so the pulse always carries an anonymousUserId.
       */
      data["anonymousUserId"] =
        AnalyticsUtil.getAnonymousId() ?? getOrCreateFallbackAnonymousId();
    } else {
      data["anonymousUserId"] = getOrCreateFallbackAnonymousId();
    }
  }

  return data;
};
