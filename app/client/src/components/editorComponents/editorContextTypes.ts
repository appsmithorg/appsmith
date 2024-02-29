import type { UpdateWidgetMetaPropertyPayload } from "actions/metaActions";
import type { WidgetSelectionRequest } from "actions/widgetSelectionActions";
import type { BatchPropertyUpdatePayload } from "components/propertyControls/propertyControlTypes";
import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import type { OccupiedSpace } from "constants/CanvasEditorConstants";
import type {
  DeleteMetaWidgetsPayload,
  ModifyMetaWidgetPayload,
  UpdateMetaWidgetPropertyPayload,
} from "reducers/entityReducers/metaWidgetsReducer";
import type { WidgetOperation } from "widgets/types";

export interface EditorContextType<TCache = unknown> {
  executeAction?: (triggerPayload: ExecuteTriggerPayload) => void;
  updateWidget?: (
    operation: WidgetOperation,
    widgetId: string,
    payload: any,
  ) => void;
  triggerEvalOnMetaUpdate?: () => void;
  updateWidgetProperty?: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
  resetChildrenMetaProperty?: (widgetId: string) => void;
  disableDrag?: (disable: boolean) => void;
  occupiedSpaces?: { [containerWidgetId: string]: OccupiedSpace[] };
  deleteWidgetProperty?: (widgetId: string, propertyPaths: string[]) => void;
  batchUpdateWidgetProperty?: (
    widgetId: string,
    updates: BatchPropertyUpdatePayload,
    shouldReplay: boolean,
  ) => void;
  syncUpdateWidgetMetaProperty?: (
    widgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => void;
  syncBatchUpdateWidgetMetaProperties?: (
    batchMetaUpdates: UpdateWidgetMetaPropertyPayload[],
  ) => void;
  updateWidgetAutoHeight?: (widgetId: string, height: number) => void;
  updateWidgetDimension?: (
    widgetId: string,
    width: number,
    height: number,
  ) => void;
  checkContainersForAutoHeight?: () => void;
  modifyMetaWidgets?: (modifications: ModifyMetaWidgetPayload) => void;
  setWidgetCache?: <TAltCache = void>(
    widgetId: string,
    data: TCache | TAltCache,
  ) => void;
  getWidgetCache?: <TAltCache = void>(
    widgetId: string,
  ) => TAltCache extends void ? TCache : TAltCache;
  deleteMetaWidgets?: (deletePayload: DeleteMetaWidgetsPayload) => void;
  updateMetaWidgetProperty?: (payload: UpdateMetaWidgetPropertyPayload) => void;
  selectWidgetRequest?: WidgetSelectionRequest;
  updatePositionsOnTabChange?: (widgetId: string, selectedTab: string) => void;
  updateOneClickBindingOptionsVisibility?: (visibility: boolean) => void;
  unfocusWidget?: () => void;
}
