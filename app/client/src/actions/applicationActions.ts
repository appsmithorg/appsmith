import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { ApplicationPayload } from "entities/Application";

export const toggleFavoriteApplication = (applicationId: string) => ({
  type: ReduxActionTypes.TOGGLE_FAVORITE_APPLICATION_INIT,
  payload: { applicationId },
});

export const toggleFavoriteApplicationSuccess = (
  applicationId: string,
  isFavorited: boolean,
) => ({
  type: ReduxActionTypes.TOGGLE_FAVORITE_APPLICATION_SUCCESS,
  payload: { applicationId, isFavorited },
});

export const toggleFavoriteApplicationError = (applicationId: string) => ({
  type: ReduxActionErrorTypes.TOGGLE_FAVORITE_APPLICATION_ERROR,
  payload: { applicationId },
});

export const fetchFavoriteApplications = () => ({
  type: ReduxActionTypes.FETCH_FAVORITE_APPLICATIONS_INIT,
});

export const fetchFavoriteApplicationsSuccess = (
  applications: ApplicationPayload[],
) => ({
  type: ReduxActionTypes.FETCH_FAVORITE_APPLICATIONS_SUCCESS,
  payload: applications,
});

export const fetchFavoriteApplicationsError = () => ({
  type: ReduxActionErrorTypes.FETCH_FAVORITE_APPLICATIONS_ERROR,
});
