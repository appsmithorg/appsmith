import { createReducer } from "../../utils/AppsmithUtils"
import {
  ReduxActionTypes,
  ReduxAction,
  LoadCanvasPayload,
  LoadWidgetCardsPanePayload
} from "../../constants/ReduxActionConstants"
import { WidgetCardProps, IWidgetProps } from "../../widgets/BaseWidget"
import { ContainerWidgetProps } from "../../widgets/ContainerWidget"

const initialState: EditorReduxState = {}

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.SUCCESS_FETCHING_WIDGET_CARDS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadWidgetCardsPanePayload>
  ) => {
    return { ...state.pageWidget, ...action.payload }
  },
  [ReduxActionTypes.ADD_PAGE_WIDGET]: (
    state: EditorReduxState,
    action: ReduxAction<{pageId: string, widget: IWidgetProps}>
  ) => {
    return state
  },
  [ReduxActionTypes.UPDATE_CANVAS]: (
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
