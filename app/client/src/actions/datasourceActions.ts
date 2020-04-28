import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { CreateDatasourceConfig, Datasource } from "api/DatasourcesApi";

export const createDatasource = (payload: CreateDatasourceConfig) => {
  return {
    type: ReduxActionTypes.CREATE_DATASOURCE_INIT,
    payload,
  };
};

export const updateDatasource = (payload: Datasource) => {
  return {
    type: ReduxActionTypes.UPDATE_DATASOURCE_INIT,
    payload,
  };
};

export const testDatasource = (payload: Partial<Datasource>) => {
  return {
    type: ReduxActionTypes.TEST_DATASOURCE_INIT,
    payload,
  };
};

export const fetchDatasources = () => {
  return {
    type: ReduxActionTypes.FETCH_DATASOURCES_INIT,
  };
};

export const selectPlugin = (pluginId: string) => {
  return {
    type: ReduxActionTypes.SELECT_PLUGIN,
    payload: {
      pluginId,
    },
  };
};

export const storeDatastoreRefs = (refsList: {}) => {
  return {
    type: ReduxActionTypes.STORE_DATASOURCE_REFS,
    payload: {
      refsList,
    },
  };
};

export const initDatasourcePane = (
  pluginType: string,
  urlId?: string,
): ReduxAction<{ pluginType: string; id?: string }> => {
  return {
    type: ReduxActionTypes.INIT_DATASOURCE_PANE,
    payload: { id: urlId, pluginType },
  };
};

export default {
  createDatasource,
  fetchDatasources,
  initDatasourcePane,
  selectPlugin,
};
