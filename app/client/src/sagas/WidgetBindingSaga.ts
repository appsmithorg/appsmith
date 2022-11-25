/*
 * Handles all widget one click binding events.
 */

import { createNewApiAction } from "actions/apiPaneActions";
import { batchUpdateMultipleWidgetProperties } from "actions/controlActions";
import { runAction, setActionProperty } from "actions/pluginActionActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { Toaster, Variant } from "design-system";
import { put, select, takeLatest } from "redux-saga/effects";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getSelectedWidgets } from "selectors/ui";

export function* updateTable(actionPayload: ReduxAction<any>): Generator<any> {
  yield put(runAction(actionPayload.payload.data.id));
  const widgetId = yield select(getSelectedWidgets);
  yield put(
    batchUpdateMultipleWidgetProperties([
      {
        widgetId: widgetId as string,
        updates: {
          modify: {
            tableData: `{{${actionPayload.payload.data.name}.data.data}}`,
          },
        },
      },
    ]),
  );
  Toaster.clear();
  Toaster.show({
    text: `Your action is now bound to the table widget!!!!`,
    hideProgressBar: false,
    variant: Variant.success,
  });
}

export function* addUrl(actionPayload: ReduxAction<any>) {
  Toaster.clear();
  Toaster.show({
    text: `Successfully created action: ${actionPayload.payload.name}`,
    hideProgressBar: false,
    variant: Variant.success,
  });
  yield delay();
  yield put(
    setActionProperty({
      actionId: actionPayload.payload.id,
      propertyName: "datasource.datasourceConfiguration",
      value: {
        url: "https://reqres.in",
      },
    }),
  );
  yield put(
    setActionProperty({
      actionId: actionPayload.payload.id,
      propertyName: "actionConfiguration.path",
      value: "/api/users?page=2",
    }),
  );
  yield takeLatest(ReduxActionTypes.UPDATE_ACTION_SUCCESS, updateTable);
}

export function* GenerateBindingQuery(): Generator<any> {
  Toaster.show({
    text: `Initiating action creation`,
    hideProgressBar: false,
    variant: Variant.info,
  });
  yield delay();
  const pageId = yield select(getCurrentPageId);
  yield put(createNewApiAction(pageId as string, "WIDGET_BINDING"));
  yield takeLatest(ReduxActionTypes.CREATE_ACTION_SUCCESS, addUrl);
}

export default function* WidgetBindingSaga() {
  yield takeLatest(
    ReduxActionTypes.GENERATE_WIDGET_BINDING_QUERY,
    GenerateBindingQuery,
  );
}

function delay() {
  return new Promise((resolve) => setTimeout(() => resolve(true), 3000));
}
