export * from "ce/actions/settingsAction";
import { FetchSamlMetadataPayload } from "@appsmith/api/UserApi";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const fetchSamlMetadata = (payload: FetchSamlMetadataPayload) => ({
  type: ReduxActionTypes.FETCH_SAML_METADATA,
  payload,
});
