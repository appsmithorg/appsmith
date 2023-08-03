import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const fetchProvisioningStatus = () => ({
  type: ReduxActionTypes.FETCH_PROVISIONING_STATUS,
});

export const generateProvisioningApiKey = (configuredStatus: boolean) => ({
  type: ReduxActionTypes.GENERATE_PROVISIONING_API_KEY,
  payload: { configuredStatus },
});

export const disconnectProvisioning = (
  keepAllProvisionedResources: boolean,
) => ({
  type: ReduxActionTypes.DISCONNECT_PROVISIONING,
  payload: {
    keepAllProvisionedResources,
  },
});
