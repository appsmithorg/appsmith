import {
  type ReduxAction,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import { updateAndSaveLayout } from "actions/pageActions";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import { executeWidgetBlueprintBeforeOperations } from "sagas/WidgetBlueprintSagas";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  WidgetLayoutProps,
} from "../../utils/anvilTypes";
import { getWidget, getWidgets } from "sagas/selectors";
import { addWidgetsToPreset } from "../../utils/layouts/update/additionUtils";
import { moveWidgets } from "../../utils/layouts/update/moveUtils";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import { generateDefaultLayoutPreset } from "layoutSystems/anvil/layoutComponents/presets/DefaultLayoutPreset";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { addWidgetsToMainCanvasLayout } from "layoutSystems/anvil/utils/layouts/update/mainCanvasLayoutUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { WDS_V2_WIDGET_MAP } from "components/wds/constants";
import { addWidgetToSection } from "./sections/utils";
import { generateReactKey } from "utils/generators";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import { SectionWidget } from "widgets/anvil/SectionWidget";

export function* getMainCanvasLastRowHighlight() {
  const mainCanvas: WidgetProps = yield select(
    getWidget,
    MAIN_CONTAINER_WIDGET_ID,
  );
  const layoutId: string = mainCanvas.layout[0].layoutId;
  const layoutOrder = [layoutId];
  const rowIndex = mainCanvas.layout[0].layout.length;
  return {
    canvasId: MAIN_CONTAINER_WIDGET_ID,
    layoutOrder,
    rowIndex,
    posX: 0,
    posY: 0,
    alignment: FlexLayerAlignment.Start,
    dropZone: {},
    height: 0,
    width: 0,
    isVertical: false,
  };
}

function* addSuggestedWidgetsAnvilSaga(
  actionPayload: ReduxAction<{
    newWidget: {
      newWidgetId: string;
      type: string;
      rows?: number;
      columns?: number;
      props: WidgetProps;
    };
  }>,
) {
  const { newWidget } = actionPayload.payload;
  const wdsEntry = Object.entries(WDS_V2_WIDGET_MAP).find(
    ([legacyType]) => legacyType === newWidget.type,
  );
  if (wdsEntry) {
    const [, wdsType] = wdsEntry;
    const newWidgetParams = {
      width: (newWidget.rows || 0 / GridDefaults.DEFAULT_GRID_COLUMNS) * 100,
      height: newWidget.columns || 0 * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      newWidgetId: newWidget.newWidgetId,
      parentId: MAIN_CONTAINER_WIDGET_ID,
      type: wdsType,
    };
    const mainCanvasHighLight: AnvilHighlightInfo = yield call(
      getMainCanvasLastRowHighlight,
    );
    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      addNewChildToDSL,
      mainCanvasHighLight,
      newWidgetParams,
      true,
      false,
    );
    updatedWidgets[newWidgetParams.newWidgetId] = {
      ...updatedWidgets[newWidgetParams.newWidgetId],
      ...newWidget.props,
    };
    yield put(updateAndSaveLayout(updatedWidgets));
    yield put(
      selectWidgetInitAction(SelectionRequestType.One, [
        newWidgetParams.newWidgetId,
      ]),
    );
  }
}

export function* addNewChildToDSL(
  highlight: AnvilHighlightInfo,
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
  },
  isMainCanvas: boolean,
  isSection: boolean,
) {
  const { alignment, canvasId } = highlight;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  // Execute Blueprint operation to update widget props before creation.
  const newParams: { [key: string]: any } = yield call(
    executeWidgetBlueprintBeforeOperations,
    BlueprintOperationTypes.UPDATE_CREATE_PARAMS_BEFORE_ADD,
    {
      parentId: canvasId,
      widgetId: newWidget.newWidgetId,
      widgets: allWidgets,
      widgetType: newWidget.type,
    },
  );
  const updatedParams: any = { ...newWidget, ...newParams };

  // Create and add widget.
  let updatedWidgets: CanvasWidgetsReduxState = yield call(
    getUpdateDslAfterCreatingChild,
    {
      ...updatedParams,
      widgetId: canvasId,
    },
  );
  const draggedWidgets: WidgetLayoutProps[] = [
    {
      alignment,
      widgetId: newWidget.newWidgetId,
      widgetType: newWidget.type,
    },
  ];

  if (!!isMainCanvas) {
    updatedWidgets = addWidgetToMainCanvas(
      updatedWidgets,
      draggedWidgets,
      highlight,
      newWidget.newWidgetId,
    );
  } else if (!!isSection) {
    updatedWidgets = addWidgetToSection(
      updatedWidgets,
      draggedWidgets,
      highlight,
      newWidget.newWidgetId,
    );
  } else {
    updatedWidgets = addWidgetToGenericLayout(
      updatedWidgets,
      draggedWidgets,
      highlight,
      newWidget,
    );
  }
  return updatedWidgets;
}

function* addWidgetsSaga(
  actionPayload: ReduxAction<{
    highlight: AnvilHighlightInfo;
    isMainCanvas?: boolean;
    isSection?: boolean;
    newWidget: {
      width: number;
      height: number;
      newWidgetId: string;
      type: string;
    };
  }>,
) {
  try {
    const start = performance.now();
    const { highlight, isMainCanvas, isSection, newWidget } =
      actionPayload.payload;

    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      addNewChildToDSL,
      highlight,
      newWidget,
      !!isMainCanvas,
      !!isSection,
    );

    yield put(updateAndSaveLayout(updatedWidgets));
    yield put(
      selectWidgetInitAction(SelectionRequestType.One, [newWidget.newWidgetId]),
    );
    log.debug("Anvil : add new widget took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
        error,
      },
    });
  }
}

function addWidgetToMainCanvas(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  widgetId: string,
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  updatedWidgets = {
    ...updatedWidgets,
    [highlight.canvasId]: {
      ...updatedWidgets[highlight.canvasId],
      children: updatedWidgets[highlight.canvasId].children?.filter(
        (each: string) => each !== widgetId,
      ),
    },
  };
  return addWidgetsToMainCanvasLayout(
    updatedWidgets,
    draggedWidgets,
    highlight,
  );
}

function addWidgetToGenericLayout(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
  },
) {
  const canvasWidget = allWidgets[highlight.canvasId];
  const canvasLayout = canvasWidget.layout
    ? canvasWidget.layout
    : generateDefaultLayoutPreset();
  /**
   * Add new widget to the children of parent canvas.
   * Also add it to parent canvas' layout.
   */
  return {
    ...allWidgets,
    [canvasWidget.widgetId]: {
      ...canvasWidget,
      layout: addWidgetsToPreset(canvasLayout, highlight, draggedWidgets),
    },
    [newWidget.newWidgetId]: {
      ...allWidgets[newWidget.newWidgetId],
      // This is a temp fix, widget dimensions will be self computed by widgets
      height: newWidget.height,
      width: newWidget.width,
    },
  };
}

/**
 * Remove widgets from current parents and layouts.
 * Add to new parent and layout.
 */
function* moveWidgetsSaga(
  actionPayload: ReduxAction<{
    highlight: AnvilHighlightInfo;
    movedWidgets: DraggedWidget[];
    isMainCanvas: boolean;
    isSection: boolean;
  }>,
) {
  try {
    const start = performance.now();
    const { highlight, isMainCanvas, isSection, movedWidgets } =
      actionPayload.payload;
    const movedWidgetIds = movedWidgets.map((each) => each.widgetId);
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    let updatedWidgets: CanvasWidgetsReduxState = {};
    const draggedWidgets: WidgetLayoutProps[] = movedWidgets.map((each) => ({
      alignment: highlight.alignment,
      widgetId: each.widgetId,
      widgetType: each.type,
    }));
    const areZonesBeingDragged = draggedWidgets.every(
      (each) => each.widgetType === ZoneWidget.type,
    );
    const areSectionsBeingDragged = draggedWidgets.every(
      (each) => each.widgetType === SectionWidget.type,
    );
    if (
      (isMainCanvas && !(areZonesBeingDragged || areSectionsBeingDragged)) ||
      isSection
    ) {
      const createdZoneWidgetId = generateReactKey();
      updatedWidgets = yield call(
        addNewChildToDSL,
        highlight,
        {
          width: 0,
          height: 0,
          newWidgetId: createdZoneWidgetId,
          type: ZoneWidget.type,
        },
        !!isMainCanvas,
        !!isSection,
      );
      const createdZoneWidget = updatedWidgets[createdZoneWidgetId];
      const createdZoneCanvasId = createdZoneWidget.children
        ? createdZoneWidget.children[0]
        : MAIN_CONTAINER_WIDGET_ID;
      const layoutOrder = [
        updatedWidgets[createdZoneCanvasId].layout[0].layoutId,
      ];
      updatedWidgets = moveWidgets(updatedWidgets, movedWidgetIds, {
        ...highlight,
        layoutOrder,
        alignment: FlexLayerAlignment.Start,
        canvasId: createdZoneCanvasId,
      });
    } else if (isMainCanvas && areZonesBeingDragged) {
      const createdSectionWidgetId = generateReactKey();
      const newSectionWidget = {
        width: 0,
        height: 0,
        newWidgetId: createdSectionWidgetId,
        type: SectionWidget.type,
      };
      updatedWidgets = yield call(
        addNewChildToDSL,
        highlight,
        newSectionWidget,
        false,
        false,
      );
      const createdSectionWidget = updatedWidgets[createdSectionWidgetId];
      const createdSectionCanvasId = createdSectionWidget.children
        ? createdSectionWidget.children[0]
        : MAIN_CONTAINER_WIDGET_ID;
      const layoutOrder = [
        updatedWidgets[createdSectionCanvasId].layout[0].layoutId,
      ];
      updatedWidgets = moveWidgets(updatedWidgets, movedWidgetIds, {
        ...highlight,
        layoutOrder,
        alignment: FlexLayerAlignment.Start,
        canvasId: createdSectionCanvasId,
      });
    } else {
      updatedWidgets = moveWidgets(allWidgets, movedWidgetIds, highlight);
    }
    yield put(updateAndSaveLayout(updatedWidgets));
    log.debug("Anvil : moving widgets took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_MOVE_WIDGET,
        error,
      },
    });
  }
}

export default function* anvilDraggingSagas() {
  yield all([
    takeLatest(AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET, addWidgetsSaga),
    takeLatest(AnvilReduxActionTypes.ANVIL_MOVE_WIDGET, moveWidgetsSaga),
    takeLatest(
      AnvilReduxActionTypes.ANVIL_ADD_SUGGESTED_WIDGET,
      addSuggestedWidgetsAnvilSaga,
    ),
  ]);
}
