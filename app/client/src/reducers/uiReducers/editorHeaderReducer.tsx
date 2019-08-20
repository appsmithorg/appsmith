import { createReducer } from "../../utils/PicassoUtils"
import {
  ActionTypes,
  ReduxAction
} from "../../constants/ActionConstants"

const initialState: EditorHeaderReduxState = {}

const editorHeaderReducer = createReducer(initialState, {})

export interface EditorHeaderReduxState {}

export default editorHeaderReducer
