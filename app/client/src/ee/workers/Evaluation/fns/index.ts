export * from "ce/workers/Evaluation/fns/index";
import {
  platformFns as ce_platformFns,
  ActionTriggerKeys as CE_ActionTriggerKeys,
  ActionTriggerFunctionNames as CE_ActionTriggerFunctionNames,
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

export const ActionTriggerFunctionNames: Record<string, string> = {
  ...CE_ActionTriggerFunctionNames,
  WINDOW_MESSAGE_LISTENER: "windowMessageListener",
  UNLISTEN_WINDOW_MESSAGE: "unlistenWindowMessage",
};

export const platformFns = [
  ...ce_platformFns,
  {
    name: "windowMessageListener",
    fn: windowMessageListener,
  },
  {
    name: "unlistenWindowMessage",
    fn: unlistenWindowMessage,
  },
];
