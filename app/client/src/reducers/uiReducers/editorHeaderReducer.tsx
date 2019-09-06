import { createReducer } from "../../utils/AppsmithUtils"

const initialState: EditorHeaderReduxState = {}

const editorHeaderReducer = createReducer(initialState, {})

export interface EditorHeaderReduxState {}

export default editorHeaderReducer
