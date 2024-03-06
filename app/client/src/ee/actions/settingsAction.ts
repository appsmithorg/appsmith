export * from "ce/actions/settingsAction";
import type { FetchSamlMetadataPayload } from "@appsmith/api/UserApi";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const fetchSamlMetadata = (payload: FetchSamlMetadataPayload) => ({
  type: ReduxActionTypes.FETCH_SAML_METADATA,
  payload,
});

export const startPollingForMigration = (shouldRedirectToBilling: boolean) => ({
  type: ReduxActionTypes.RESTART_SERVER_POLL_LICENSE_MIGRATION,
  shouldRedirectToBilling,
});

export const retryPollingForMigration = (shouldRedirectToBilling: boolean) => ({
  type: ReduxActionTypes.RETRY_SERVER_POLL_LICENSE_MIGRATION,
  shouldRedirectToBilling,
});
