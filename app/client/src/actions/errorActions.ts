import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const flushErrors = () => {
  return {
    type: ReduxActionTypes.FLUSH_ERRORS,
  };
};
