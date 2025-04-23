/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AppState } from "ee/reducers";
import type { Module } from "ee/constants/ModuleConstants";

export const getAllModules = (
  state: AppState,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, Module> | any => {};

export const getCurrentModuleId = (state: AppState) => "";

export const showUIModulesList = (state: AppState) => false;
