export * from "ce/workers/Evaluation/fns/index";
import type {
  ActionTriggerKeys as CE_ActionTriggerKeys,
  ActionDescription as CE_ActionDescription,
} from "ce/workers/Evaluation/fns/index";
import {
  getPlatformFunctions as CE_getPlatformFunctions,
  getActionTriggerFunctionNames as CE_getActionTriggerFunctionNames,
  getEntityFunctions as CE_getEntityFunctions,
} from "ce/workers/Evaluation/fns/index";
import type {
  TUnlistenWindowMessageDescription,
  TUnlistenWindowMessageType,
  TWindowMessageListenerDescription,
  TWindowMessageListenerType,
} from "./messageListenerFns/index";
import {
  unlistenWindowMessage,
  windowMessageListener,
} from "./messageListenerFns/index";
import { isWindowMessageListenerEnabled } from "@appsmith/utils/planHelpers";
import { WorkerEnv } from "workers/Evaluation/handlers/workerEnv";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import { isAppsmithEntity } from "../evaluationUtils";
import {
  getFnWithGuards,
  isAsyncGuard,
} from "workers/Evaluation/fns/utils/fnGuard";
import {
  workflowsAssignRequest,
  type TWorkflowsAssignRequestActionType,
  type TWorkflowsAssignRequestDescription,
} from "./workflowFns";

type EE_ActionTriggerKeys =
  | TWindowMessageListenerType
  | TUnlistenWindowMessageType
  | TWorkflowsAssignRequestActionType;

export type ActionTriggerKeys = CE_ActionTriggerKeys | EE_ActionTriggerKeys;

type EE_ActionDescription =
  | TWindowMessageListenerDescription
  | TUnlistenWindowMessageDescription
  | TWorkflowsAssignRequestDescription;

export type ActionDescription = CE_ActionDescription | EE_ActionDescription;

export const getActionTriggerFunctionNames = (): Record<string, string> => {
  const triggerFunctions = CE_getActionTriggerFunctionNames();
  const featureFlags = WorkerEnv.getFeatureFlags();
  const isMessageListenerEnabled = isWindowMessageListenerEnabled(featureFlags);
  return {
    ...triggerFunctions,
    ASSIGN_REQUEST: "assignRequest",
    ...(isMessageListenerEnabled && {
      WINDOW_MESSAGE_LISTENER: "windowMessageListener",
      UNLISTEN_WINDOW_MESSAGE: "unlistenWindowMessage",
    }),
  };
};

export const getPlatformFunctions = () => {
  const platformFns = CE_getPlatformFunctions();
  const featureFlags = WorkerEnv.getFeatureFlags();
  const isMessageListenerEnabled = isWindowMessageListenerEnabled(featureFlags);

  return isMessageListenerEnabled
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

export const getEntityFunctions = () => {
  const entityFns = CE_getEntityFunctions();

  return [
    ...entityFns,
    {
      name: "assignRequest",
      path: "appsmith.workflows.assignRequest",
      qualifier: (entity: DataTreeEntity) => isAppsmithEntity(entity),
      fn: () =>
        getFnWithGuards(
          workflowsAssignRequest,
          "appsmith.workflows.assignRequest",
          [isAsyncGuard],
        ),
    },
  ];
};
