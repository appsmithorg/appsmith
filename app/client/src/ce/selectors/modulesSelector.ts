/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DefaultRootState } from "react-redux";
import type { Module } from "ee/constants/ModuleConstants";

export const getAllModules = (
  state: DefaultRootState,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, Module> | any => {};

export const getCurrentModuleId = (state: DefaultRootState) => "";

export const getCurrentBaseModuleId = (state: DefaultRootState) => "";

export const showUIModulesList = (state: DefaultRootState) => false;
