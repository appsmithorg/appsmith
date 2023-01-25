export * from "ce/entities/DataTree/actionTriggers";

import {
  ActionTriggerKeys as CE_ActionTriggerKeys,
  ActionTriggerFunctionNames as CE_ActionTriggerFunctionNames,
  ActionDescription as CE_ActionDescription,
} from "ce/entities/DataTree/actionTriggers";

type EE_ActionTriggerKeys =
  | "WINDOW_MESSAGE_LISTENER"
  | "UNLISTEN_WINDOW_MESSAGE";

export type ActionTriggerKeys = CE_ActionTriggerKeys | EE_ActionTriggerKeys;

export const ActionTriggerFunctionNames: Record<ActionTriggerKeys, string> = {
  ...CE_ActionTriggerFunctionNames,
  WINDOW_MESSAGE_LISTENER: "windowMessageListener",
  UNLISTEN_WINDOW_MESSAGE: "unlistenWindowMessage",
};

// TODO: look for ways to extend interface
// to use the updated ActionTriggerKeys
export interface ActionDescriptionInterface<T, Type extends ActionTriggerKeys> {
  type: Type;
  payload: T;
}

export type WindowMessageListenerDescription = ActionDescriptionInterface<
  {
    acceptedOrigin: string;
    callbackString: string;
  },
  "WINDOW_MESSAGE_LISTENER"
>;

export type UnlistenWindowMessageDescription = ActionDescriptionInterface<
  {
    origin: string;
  },
  "UNLISTEN_WINDOW_MESSAGE"
>;

type EE_ActionDescription =
  | WindowMessageListenerDescription
  | UnlistenWindowMessageDescription;

export type ActionDescription = CE_ActionDescription | EE_ActionDescription;
