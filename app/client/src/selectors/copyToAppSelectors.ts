import type { DefaultRootState } from "react-redux";
import type { ApplicationPayload } from "entities/Application";

export const getCopyTargetApplications = (
  state: DefaultRootState,
): ApplicationPayload[] => state.ui.copyEntityToApp.targetApplications;

export const getIsFetchingCopyTargetApplications = (
  state: DefaultRootState,
): boolean => state.ui.copyEntityToApp.isFetchingApplications;

export const getIsCopyingEntityToApp = (state: DefaultRootState): boolean =>
  state.ui.copyEntityToApp.isCopying;
