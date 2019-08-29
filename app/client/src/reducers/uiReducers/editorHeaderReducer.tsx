import { createReducer } from "../../utils/PicassoUtils"

const initialState: EditorHeaderReduxState = {}

const editorHeaderReducer = createReducer(initialState, {})

export interface EditorHeaderReduxState {}

export default editorHeaderReducer
