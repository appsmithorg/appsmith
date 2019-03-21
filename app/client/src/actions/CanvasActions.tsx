import { IContainerWidgetProps } from "../widgets/ContainerWidget"
import CanvasWidgetsNormalizer, { widgetSchema } from "../normalizers/CanvasWidgetsNormalizer"
import { LoadCanvasPayload, ActionTypes, ReduxAction } from "../constants/ActionConstants"

export const loadCanvas = (canvasResponse: PageResponse): ReduxAction<LoadCanvasPayload> => {
  const normalizedResponse = CanvasWidgetsNormalizer.normalize(canvasResponse)
  return {
    type: ActionTypes.LOAD_CANVAS,
    payload: {
        pageWidgetId: normalizedResponse.result,
        widgets: normalizedResponse.entities.canvasWidgets
    }
  }
}

export interface PageResponse {
  pageWidget: IContainerWidgetProps<any>
}
