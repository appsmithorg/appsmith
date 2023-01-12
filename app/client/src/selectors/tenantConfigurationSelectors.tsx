import { AppState } from "@appsmith/reducers";

export const getMapsApiKey = (state: AppState): string | undefined =>
  state.tenant?.tenantConfiguration?.googleMapsKey as string | undefined;
