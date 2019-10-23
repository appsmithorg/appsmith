import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import { CreateResourceConfig } from "../api/ResourcesApi";

export const createResource = (payload: CreateResourceConfig) => {
  return {
    type: ReduxActionTypes.CREATE_RESOURCE_INIT,
    payload,
  };
};

export const fetchResources = () => {
  return {
    type: ReduxActionTypes.FETCH_RESOURCES_INIT,
  };
};

export default {
  createResource,
  fetchResources,
};
