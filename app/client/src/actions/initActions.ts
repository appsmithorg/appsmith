import {
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "../constants/ReduxActionConstants";

export const initEditor = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.INIT_EDITOR,
});
