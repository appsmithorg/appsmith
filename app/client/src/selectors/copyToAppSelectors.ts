import type { DefaultRootState } from "react-redux";
import type { ApplicationPayload } from "entities/Application";
import type { CopyToAppModalEntity } from "pages/Editor/Explorer/CopyToApp/types";

export const getIsCopyToAppModalOpen = (state: DefaultRootState): boolean =>
  state.ui.copyEntityToApp.isModalOpen;

export const getCopyToAppModalEntity = (
  state: DefaultRootState,
): CopyToAppModalEntity | null => state.ui.copyEntityToApp.entity;

export const getCopyTargetApplications = (
  state: DefaultRootState,
): ApplicationPayload[] => state.ui.copyEntityToApp.targetApplications;

export const getIsFetchingCopyTargetApplications = (
  state: DefaultRootState,
): boolean => state.ui.copyEntityToApp.isFetchingApplications;

export const getIsCopyingEntityToApp = (state: DefaultRootState): boolean =>
  state.ui.copyEntityToApp.isCopying;
