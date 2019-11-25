import { createSelector } from "reselect";
import { AppState } from "reducers";
import { ApplicationsReduxState } from "reducers/uiReducers/applicationsReducer";
import { ApplicationPayload } from "constants/ReduxActionConstants";

const getApplicationsState = (state: AppState) => state.ui.applications;

export const getApplicationList = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): ApplicationPayload[] =>
    applications.applicationList,
);

export const getIsFetchingApplications = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): boolean =>
    applications.isFetchingApplications,
);

export const getIsCreatingApplication = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): boolean =>
    applications.creatingApplication,
);

export const getCreateApplicationError = createSelector(
  getApplicationsState,
  (applications: ApplicationsReduxState): string | undefined =>
    applications.createApplicationError,
);
