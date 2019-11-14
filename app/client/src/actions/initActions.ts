import {
  ReduxActionTypes,
  ReduxActionWithoutPayload,
} from "../constants/ReduxActionConstants";

export const initEditor = (): ReduxActionWithoutPayload => ({
  type: ReduxActionTypes.INITIALIZE_EDITOR,
});
