import { createReducer } from "../../utils/AppsmithUtils"
import {
  ReduxActionTypes,
  ReduxAction,
  LoadAPIResponsePayload,
  LoadQueryResponsePayload
} from "../../constants/ReduxActionConstants"
import { ExecuteActionResponse } from '../../api/ActionAPI'

const initialState: QueryDataReducer = {

}

export interface QueryDataReducer {
  [name: string]: ExecuteActionResponse
}

const queryDataReducer = createReducer(initialState, {
  [ReduxActionTypes.LOAD_API_RESPONSE]: (
    state: QueryDataReducer,
    action: ReduxAction<LoadQueryResponsePayload>
  ) => {
    return { ...state, [action.payload.actionId]: action.payload }
  }
})

export default queryDataReducer
