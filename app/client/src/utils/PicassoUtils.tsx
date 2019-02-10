import { ReduxAction } from "../constants/ActionConstants"

export const createReducer = (
  initialState: any,
  handlers: { [actionType: string]: Function }
) => {
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.actionType)) {
      return handlers[action.actionType](state, action)
    } else {
      return state
    }
  }
}
