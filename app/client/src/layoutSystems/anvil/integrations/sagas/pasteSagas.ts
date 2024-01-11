import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLeading } from "redux-saga/effects";
import { getSelectedWidgetWhenPasting } from "sagas/WidgetOperationUtils";
import { getWidgets } from "sagas/selectors";
import { updateAndSaveAnvilLayout } from "../../utils/anvilChecksUtils";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  type ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import history from "utils/history";
import type { CopiedWidgetData } from "../../utils/paste/types";
import {
  getNewParentId,
  splitWidgetsByHierarchy,
  splitWidgetsOnResidenceStatus,
} from "../../utils/paste/utils";
import { pasteMigrantWidgets } from "../../utils/paste/migrantUtils";
import { pasteResidentWidgets } from "../../utils/paste/residentUtils";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { getCopiedWidgets } from "utils/storage";

function* pasteWidgetSagas() {
  try {
    const {
      widgets: copiedWidgets,
    }: {
      widgets: CopiedWidgetData[];
    } = yield getCopiedWidgets();
    const originalWidgets: CopiedWidgetData[] = [...copiedWidgets];

    if (!originalWidgets.length) return;

    const selectedWidget: FlattenedWidgetProps =
      yield getSelectedWidgetWhenPasting();

    let allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

    /**
     * Order widgets based on hierarchy.
     * MainCanvas > Section > Zone > Others.
     */
    const order: CopiedWidgetData[][] = splitWidgetsByHierarchy(copiedWidgets);

    /**
     * Get new parentId to paste widgets into.
     */

    const newParentId: string | null = getNewParentId(
      allWidgets,
      selectedWidget,
      originalWidgets,
      order,
    );

    if (!newParentId) {
      return;
    }

    /**
     * Split copied widgets based on whether their parent has changed.
     */
    const {
      migrants,
      residents,
    }: { migrants: CopiedWidgetData[]; residents: CopiedWidgetData[] } =
      splitWidgetsOnResidenceStatus(originalWidgets, newParentId);

    /**
     * Track mapping between original and new widgetIds.
     */
    let widgetIdMap: Record<string, string> = {};
    let reverseWidgetIdMap: Record<string, string> = {};

    /**
     * For each resident, add them next to the original copied widget.
     */
    if (residents.length) {
      const res: {
        map: Record<string, string>;
        reverseMap: Record<string, string>;
        widgets: CanvasWidgetsReduxState;
      } = yield call(
        pasteResidentWidgets,
        allWidgets,
        widgetIdMap,
        reverseWidgetIdMap,
        residents,
        newParentId,
      );
      allWidgets = res.widgets;
      widgetIdMap = res.map;
      reverseWidgetIdMap = res.reverseMap;
    }

    /**
     * For each migrant, add them at the end of the new parent.
     * Order of migration should be maintained.
     */
    if (migrants.length) {
      /**
       * For each migrant,
       * 1. Create new widget.
       * 2. Update properties.
       * 3. Get original containing layouts.
       * 4. If newParent.childTemplate?.layoutType matches originalLayout.layoutType,
       *  4.1. true => Check if required layout already exists.
       *   a) true => add to the layout.
       *   b) false => add a new layout at the end of the parent.
       *  4.2. false => create new child template layout and add widget to it.
       *  4.3. newParent.childTemplate === null,
       *    => add all widgets to the end of the new parent.
       */

      const res: {
        map: Record<string, string>;
        reverseMap: Record<string, string>;
        widgets: CanvasWidgetsReduxState;
      } = yield call(
        pasteMigrantWidgets,
        allWidgets,
        widgetIdMap,
        reverseWidgetIdMap,
        newParentId,
        order,
      );
      allWidgets = res.widgets;
      widgetIdMap = res.map;
      reverseWidgetIdMap = res.reverseMap;
    }

    /**
     * Save state
     */
    yield call(updateAndSaveAnvilLayout, allWidgets);

    const pageId: string = yield select(getCurrentPageId);

    if (originalWidgets?.length) {
      history.push(builderURL({ pageId }));
    }

    yield put({
      type: ReduxActionTypes.RECORD_RECENTLY_ADDED_WIDGET,
      payload: Object.values(widgetIdMap),
    });

    yield put(
      selectWidgetInitAction(
        SelectionRequestType.Multiple,
        Object.values(widgetIdMap),
      ),
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.PASTE_COPIED_WIDGET_INIT,
        error,
      },
    });
  }
}

function* shouldCallSaga(saga: any, action: ReduxAction<unknown>) {
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);
  if (layoutSystemType === LayoutSystemTypes.ANVIL) {
    yield call(saga, action);
  }
}

export default function* pasteSagas() {
  yield all([
    takeLeading(
      ReduxActionTypes.PASTE_COPIED_WIDGET_INIT,
      shouldCallSaga,
      pasteWidgetSagas,
    ),
  ]);
}
