import { toast } from "@appsmith/ads";
import { createMessage } from "@appsmith/ads-old";
import { CANNOT_GENERATE_SCHEMA } from "ee/constants/messages";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { all, call, put, takeLatest } from "redux-saga/effects";
import { updateFunctionProperty } from "../actions/jsPaneActions";
import { updateActionProperty } from "../actions/pluginActionActions";
import type { ReduxAction } from "../actions/ReduxActionTypes";
import type { ApiResponse } from "../api/ApiResponses";
import { SchemaAPI, type GenerateSchemaResponse } from "../api/SchemaAPI";
import type { JSAction } from "../entities/JSCollection";

function* generatePluginActionSchemaSaga(action: ReduxAction<{ id: string }>) {
  const { id } = action.payload;

  try {
    const response: ApiResponse<GenerateSchemaResponse> = yield call(
      SchemaAPI.generateSchema,
      id,
    );

    yield put(
      updateActionProperty({
        id,
        field: "schema",
        value: response.data.schema,
      }),
    );
    yield put(
      updateActionProperty({
        id,
        field: "description",
        value: response.data.description,
      }),
    );

    yield put({
      type: ReduxActionTypes.GENERATE_PLUGIN_ACTION_SCHEMA_SUCCESS,
      payload: { id },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GENERATE_PLUGIN_ACTION_SCHEMA_ERROR,
      payload: { id },
    });

    toast.show(createMessage(CANNOT_GENERATE_SCHEMA), {
      kind: "error",
    });
  }
}

function* generateJSFunctionSchemaSuccessSaga(
  reduxAction: ReduxAction<{ action: JSAction }>,
) {
  const { action } = reduxAction.payload;

  try {
    const response: ApiResponse<GenerateSchemaResponse> = yield call(
      SchemaAPI.generateSchema,
      action.id,
    );

    yield put(
      updateFunctionProperty({
        action,
        propertyName: "schema",
        value: response.data.schema,
      }),
    );
    yield put(
      updateFunctionProperty({
        action,
        propertyName: "description",
        value: response.data.description,
      }),
    );

    yield put({
      type: ReduxActionTypes.GENERATE_JS_FUNCTION_SCHEMA_SUCCESS,
      payload: { action },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.GENERATE_JS_FUNCTION_SCHEMA_ERROR,
      payload: { action },
    });

    toast.show(createMessage(CANNOT_GENERATE_SCHEMA), {
      kind: "error",
    });
  }
}

export function* watchGenerateSchemaSaga() {
  yield all([
    takeLatest(
      ReduxActionTypes.GENERATE_PLUGIN_ACTION_SCHEMA_REQUEST,
      generatePluginActionSchemaSaga,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_JS_FUNCTION_SCHEMA_REQUEST,
      generateJSFunctionSchemaSuccessSaga,
    ),
  ]);
}
