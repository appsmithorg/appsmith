import {
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "../constants/ReduxActionConstants";

export const initAppData = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.INIT_APP_DATA,
});
