import {
  REDEPLOY_APP_BUTTON_TOOLTIP,
  REDEPLOY_APP_WARNING,
} from "ee/constants/messages";

export const REDEPLOY_TRIGGERS = {
  PendingDeployment: "PENDING_DEPLOYMENT",
} as const;

type ValueOf<T> = T[keyof T];
export type RedeployTriggerValue = ValueOf<typeof REDEPLOY_TRIGGERS>;

export const REDEPLOY_WARNING_MESSAGE: Record<
  RedeployTriggerValue,
  () => string
> = {
  [REDEPLOY_TRIGGERS.PendingDeployment]: REDEPLOY_APP_WARNING,
};

export const REDEPLOY_BUTTON_TOOLTIP: Record<
  RedeployTriggerValue,
  () => string
> = {
  [REDEPLOY_TRIGGERS.PendingDeployment]: REDEPLOY_APP_BUTTON_TOOLTIP,
};
