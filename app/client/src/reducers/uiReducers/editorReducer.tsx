import { createReducer } from "../../utils/AppsmithUtils"
import {
  ActionTypes,
  ReduxAction,
  LoadCanvasPayload,
  LoadWidgetCardsPanePayload
} from "../../constants/ActionConstants"
import { WidgetCardProps, WidgetProps } from "../../widgets/BaseWidget"
import { ContainerWidgetProps } from "../../widgets/ContainerWidget"

const initialState: EditorReduxState = {}

const editorReducer = createReducer(initialState, {
  [ActionTypes.SUCCESS_FETCHING_WIDGET_CARDS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadWidgetCardsPanePayload>
  ) => {
    return { ...state.pageWidget, ...action.payload }
  },
  [ActionTypes.ADD_PAGE_WIDGET]: (
    state: EditorReduxState,
    action: ReduxAction<{pageId: string, widget: WidgetProps}>
  ) => {
    return state
  },
  [ActionTypes.UPDATE_CANVAS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadCanvasPayload>
  ) => {
    return { pageWidgetId: action.payload.pageWidgetId }
  }
})

export interface EditorReduxState {
  pageWidget?: ContainerWidgetProps<any>;
  cards?: {
    [id: string]: WidgetCardProps[];
  };
}

export default editorReducer
