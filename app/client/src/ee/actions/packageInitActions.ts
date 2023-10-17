import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export interface InitPackageEditorPayload {
  packageId: string;
}

export const initPackageEditor = (payload: InitPackageEditorPayload) => ({
  type: ReduxActionTypes.INITIALIZE_PACKAGE_EDITOR,
  payload,
});
