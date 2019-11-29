import {
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "constants/ReduxActionConstants";

export const fetchPlugins = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.FETCH_PLUGINS_REQUEST,
});
