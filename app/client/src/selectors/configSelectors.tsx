import { AppState } from "@appsmith/reducers";
import { getCurrentUser } from "./usersSelectors";

export const getMapsApiKey = (state: AppState): string | undefined =>
  getCurrentUser(state)?.instanceConfig?.googleMapsKey;
