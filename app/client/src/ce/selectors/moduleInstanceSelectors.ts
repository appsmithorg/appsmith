/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DefaultRootState } from "react-redux";
import type { ModuleInstance } from "ee/constants/ModuleInstanceConstants";
import type { MODULE_TYPE } from "ee/constants/ModuleConstants";
import type { JSCollection } from "entities/JSCollection";
import type { Action } from "entities/Action";

export const getModuleInstanceById = (
  state: DefaultRootState,
  id: string,
): ModuleInstance | undefined => undefined;

export const getModuleInstancePublicEntity = (
  state: DefaultRootState,
  moduleInstanceId: string,
  type: MODULE_TYPE | undefined,
): Action | JSCollection | undefined => {
  return undefined;
};

export const getModuleInstanceJSCollectionById = (
  state: DefaultRootState,
  jsCollectionId: string,
): JSCollection | undefined => {
  return undefined;
};

// Ankita: check
