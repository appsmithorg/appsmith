/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Module } from "ee/constants/ModuleConstants";
import type { AppState } from "ee/reducers";

export const getAllModules = (
  state: AppState,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, Module> | any => {};

export const getCurrentModuleId = (state: AppState) => "";
