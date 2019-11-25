import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { CreateDatasourceConfig } from "api/DatasourcesApi";

export const createDatasource = (payload: CreateDatasourceConfig) => {
  return {
    type: ReduxActionTypes.CREATE_DATASOURCE_INIT,
    payload,
  };
};

export const fetchDatasources = () => {
  return {
    type: ReduxActionTypes.FETCH_DATASOURCES_INIT,
  };
};

export default {
  createDatasource,
  fetchDatasources,
};
