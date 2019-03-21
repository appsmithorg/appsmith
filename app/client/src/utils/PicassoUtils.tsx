import { ReduxAction } from "../constants/ActionConstants"

export const createReducer = (
  initialState: any,
  handlers: { [type: string]: Function }
) => {
  return function reducer(state = initialState, action: ReduxAction<any>) {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action)
    } else {
      return state
    }
  }
}
