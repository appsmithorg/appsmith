import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { CreateDatasourceConfig, Datasource } from "api/DatasourcesApi";

export const createDatasource = (payload: CreateDatasourceConfig) => {
  return {
    type: ReduxActionTypes.CREATE_DATASOURCE_INIT,
    payload,
  };
};

export const createDatasourceFromForm = (payload: CreateDatasourceConfig) => {
  return {
    type: ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT,
    payload,
  };
};

export const updateDatasource = (payload: Datasource) => {
  return {
    type: ReduxActionTypes.UPDATE_DATASOURCE_INIT,
    payload,
  };
};

export const fetchDatasourceStructure = (id: string) => {
  return {
    type: ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT,
    payload: {
      id,
    },
  };
};

export const saveDatasourceName = (payload: { id: string; name: string }) => ({
  type: ReduxActionTypes.SAVE_DATASOURCE_NAME,
  payload: payload,
});

export const changeDatasource = (payload: Datasource) => {
  return {
    type: ReduxActionTypes.CHANGE_DATASOURCE,
    payload,
  };
};

export const switchDatasource = (id: string) => {
  return {
    type: ReduxActionTypes.SWITCH_DATASOURCE,
    payload: { datasourceId: id },
  };
};

export const testDatasource = (payload: Partial<Datasource>) => {
  return {
    type: ReduxActionTypes.TEST_DATASOURCE_INIT,
    payload,
  };
};

export const deleteDatasource = (payload: Partial<Datasource>) => {
  return {
    type: ReduxActionTypes.DELETE_DATASOURCE_INIT,
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

export const storeAsDatasource = () => {
  return {
    type: ReduxActionTypes.STORE_AS_DATASOURCE_INIT,
  };
};

export default {
  createDatasource,
  fetchDatasources,
  initDatasourcePane,
  selectPlugin,
};
