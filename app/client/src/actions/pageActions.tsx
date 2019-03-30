import {
  ReduxAction,
  ActionTypes
} from "../constants/ActionConstants"
import { PageRequest } from "../api/PageApi"
import { RenderMode } from "../constants/WidgetConstants";

export const fetchPage = (pageId: string, renderMode: RenderMode): ReduxAction<PageRequest> => {
  return {
    type: ActionTypes.FETCH_PAGE,
    payload: {
      pageId: pageId,
      renderMode: renderMode
    }
  }
}
