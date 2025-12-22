import { REDEPLOY_APP_WARNING } from "ee/constants/messages";

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

export const REDEPLOY_DOC_URL: Record<RedeployTriggerValue, string> = {
  [REDEPLOY_TRIGGERS.PendingDeployment]:
    "https://docs.appsmith.com/help-and-support/troubleshooting-guide/git-errors#edit-and-view-mode-out-of-sync",
};
