import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "constants/ReduxActionConstants";
import { NamePathBindingMap } from "constants/BindingsConstants";

export const initBindingMapListener = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.CREATE_UPDATE_BINDINGS_MAP_LISTENER_INIT,
});

export const bindingsMapSuccess = (
  map: NamePathBindingMap,
): ReduxAction<NamePathBindingMap> => ({
  type: ReduxActionTypes.CREATE_UPDATE_BINDINGS_MAP_SUCCESS,
  payload: map,
});
