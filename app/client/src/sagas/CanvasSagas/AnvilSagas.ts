import type { WidgetAddChild } from "actions/pageActions";
import { updateAndSaveLayout } from "actions/pageActions";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { LayoutDirection } from "layoutSystems/anvil/utils/constants";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, takeLatest } from "redux-saga/effects";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import type { HighlightInfo } from "layoutSystems/anvil/utils/autoLayoutTypes";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { generateReactKey } from "widgets/WidgetUtils";

function* addNewWidgetSaga(
  actionPayload: ReduxAction<{
    newWidget: WidgetAddChild;
    parentId: string;
    direction: LayoutDirection;
    dropPayload: HighlightInfo;
    addToBottom: boolean;
  }>,
) {
  const start = performance.now();
  const { newWidget, parentId } = actionPayload.payload;

  try {
    // TODO: Execute blueprint before operation

    const updatedDSL: CanvasWidgetsReduxState = yield call(
      getUpdateDslAfterCreatingChild,
      {
        ...newWidget,
        widgetId: parentId,
      },
    );

    // updatedDSL[MAIN_CONTAINER_WIDGET_ID].layout = undefined;

    if (parentId === MAIN_CONTAINER_WIDGET_ID && !updatedDSL[parentId].layout) {
      // TODO: These are temporary. We need have created other task to add layout for the main canvas
      // Adding layout to the main canvas for the first time.
      updatedDSL[parentId].layout = [
        {
          layoutId: generateReactKey(),
          layoutType: "ROW",
          layoutStyle: {
            height: "500px",
            border: "1px dotted black",
          },
          rendersWidgets: true,
          isDropTarget: true,
          layout: [newWidget.newWidgetId],
        },
      ];
    } else {
      // Add new widget to the layout
      // Will be replaced with LayoutComponent.addChild
      if (updatedDSL[parentId].layout) {
        updatedDSL[parentId].layout = [
          {
            ...updatedDSL[parentId].layout[0],
            layout: [
              ...updatedDSL[parentId].layout[0].layout,
              newWidget.newWidgetId,
            ],
          },
        ];
      }
    }

    if (!parentId || !updatedDSL[parentId]) {
      return updatedDSL;
    }

    yield put(updateAndSaveLayout(updatedDSL));
    log.debug("Anvil: add new widget took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: ReduxActionTypes.ANVIL_ADD_NEW_WIDGETS,
        error,
      },
    });
  }
}

// TODO: Create a middleware that checks the current layout system and calls
// the appropriate sagas for ADD_NEW_WIDGET and other operations
export default function* anvilSagas() {
  yield all([
    takeLatest(ReduxActionTypes.ANVIL_ADD_NEW_WIDGETS, addNewWidgetSaga),
  ]);
}
