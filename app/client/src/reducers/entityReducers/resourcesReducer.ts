import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import { Resource } from "../../api/ResourcesApi";
import { REST_PLUGIN_ID } from "../../constants/ApiEditorConstants";

export interface ResourceDataState {
  list: Resource[];
  loading: boolean;
}

const initialState: ResourceDataState = {
  list: [],
  loading: false,
};

const resourceReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_RESOURCES_INIT]: (state: ResourceDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.CREATE_RESOURCE_INIT]: (state: ResourceDataState) => {
    return { ...state, loading: true };
  },
  [ReduxActionTypes.FETCH_RESOURCES_SUCCESS]: (
    state: ResourceDataState,
    action: ReduxAction<Resource[]>,
  ) => {
    return {
      ...state,
      loading: false,
      // TODO(hetu) Once plugins are being pulled get Ids from there
      list: action.payload.filter(r => r.pluginId === REST_PLUGIN_ID),
    };
  },
  [ReduxActionTypes.CREATE_RESOURCE_SUCCESS]: (
    state: ResourceDataState,
    action: ReduxAction<Resource>,
  ) => {
    return {
      ...state,
      loading: false,
      list: state.list.concat(action.payload),
    };
  },
});

export default resourceReducer;
