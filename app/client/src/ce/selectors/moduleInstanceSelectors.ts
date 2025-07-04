/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DefaultRootState } from "react-redux";
import type { ModuleInstance } from "ee/constants/ModuleInstanceConstants";
import type { JSCollection } from "entities/JSCollection";

export const getModuleInstanceById = (
  state: DefaultRootState,
  id: string,
): ModuleInstance | undefined => undefined;

export const getModuleInstanceJSCollectionById = (
  state: DefaultRootState,
  jsCollectionId: string,
): JSCollection | undefined => {
  return undefined;
};
export const getAllUniqueWidgetTypesInUiModules = (state: DefaultRootState) => {
  return [];
};
