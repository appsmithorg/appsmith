export * from "ce/workers/Evaluation/fns/index";
import {
  getPlatformFunctions as CE_getPlatformFunctions,
  ActionTriggerKeys as CE_ActionTriggerKeys,
  getActionTriggerFunctionNames as CE_getActionTriggerFunctionNames,
  ActionDescription as CE_ActionDescription,
} from "ce/workers/Evaluation/fns/index";
import {
  TUnlistenWindowMessageDescription,
  TUnlistenWindowMessageType,
  TWindowMessageListenerDescription,
  TWindowMessageListenerType,
  unlistenWindowMessage,
  windowMessageListener,
} from "./messageListenerFns";

type EE_ActionTriggerKeys =
  | TWindowMessageListenerType
  | TUnlistenWindowMessageType;

export type ActionTriggerKeys = CE_ActionTriggerKeys | EE_ActionTriggerKeys;

type EE_ActionDescription =
  | TWindowMessageListenerDescription
  | TUnlistenWindowMessageDescription;

export type ActionDescription = CE_ActionDescription | EE_ActionDescription;

export const getActionTriggerFunctionNames = (
  cloudHosting: boolean,
): Record<string, string> => {
  return {
    ...CE_getActionTriggerFunctionNames(cloudHosting),
    ...(!cloudHosting && {
      WINDOW_MESSAGE_LISTENER: "windowMessageListener",
      UNLISTEN_WINDOW_MESSAGE: "unlistenWindowMessage",
    }),
  };
};

export const getPlatformFunctions = (cloudHosting: boolean) => {
  const platformFns = CE_getPlatformFunctions(cloudHosting);
  return !cloudHosting
    ? [
        ...platformFns,
        {
          name: "windowMessageListener",
          fn: windowMessageListener,
        },
        {
          name: "unlistenWindowMessage",
          fn: unlistenWindowMessage,
        },
      ]
    : platformFns;
};
