import { createReducer } from "../../utils/AppsmithUtils"
import {
  ReduxActionTypes,
  ReduxAction,
  LoadAPIResponsePayload
} from "../../constants/ReduxActionConstants"
import { ExecuteActionResponse } from '../../api/ActionAPI'

const initialState: APIDataReducer = {

}

export interface APIDataReducer {
  [name: string]: ExecuteActionResponse
}

const apiDataReducer = createReducer(initialState, {
  [ReduxActionTypes.LOAD_API_RESPONSE]: (
    state: APIDataReducer,
    action: ReduxAction<LoadAPIResponsePayload>
  ) => {
    return { ...state, [action.payload.actionId]: action.payload }
  }
})

export default apiDataReducer
