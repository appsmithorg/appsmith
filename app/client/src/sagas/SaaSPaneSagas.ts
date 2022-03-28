import { all, put, select, takeEvery } from "redux-saga/effects";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
} from "constants/ReduxActionConstants";
import history from "utils/history";
import { getDatasource, getPlugin } from "selectors/entitiesSelector";
import { Datasource } from "entities/Datasource";
import { Action, PluginType } from "entities/Action";
import { SAAS_EDITOR_FORM } from "constants/forms";
import { getFormData } from "selectors/formSelectors";
import { setActionProperty } from "actions/pluginActionActions";
import { autofill } from "redux-form";

import { get } from "lodash";
import { updateReplayEntity } from "actions/pageActions";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { Plugin } from "api/PluginApi";
import { saasEditorApiIdURL, saasEditorDatasourceIdURL } from "RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";

function* handleDatasourceCreatedSaga(actionPayload: ReduxAction<Datasource>) {
  const plugin = yield select(getPlugin, actionPayload.payload.pluginId);
  // Only look at SAAS plugins
  if (plugin.type !== PluginType.SAAS) return;

  history.push(
    saasEditorDatasourceIdURL({
      pluginPackageName: plugin.packageName,
      datasourceId: actionPayload.payload.id,
      params: { from: "datasources" },
    }),
  );
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<Action>) {
  const { id, pluginId } = actionPayload.payload;
  const plugin: Plugin = yield select(getPlugin, pluginId);

  if (plugin.type !== "SAAS") return;
  history.push(
    saasEditorApiIdURL({
      pluginPackageName: plugin.packageName,
      apiId: id,
      params: {
        editName: "true",
        from: "datasources",
      },
    }),
  );
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string; form: string }>,
) {
  const { field, form } = actionPayload.meta;
  if (field === "dynamicBindingPathList" || field === "name") return;
  if (form !== SAAS_EDITOR_FORM) return;
  const { values } = yield select(getFormData, SAAS_EDITOR_FORM);
  if (field === "datasource.id") {
    const datasource = yield select(getDatasource, actionPayload.payload);

    // Update the datasource not just the datasource id.
    yield put(
      setActionProperty({
        actionId: values.id,
        propertyName: "datasource",
        value: datasource,
      }),
    );

    // Update the datasource of the form as well
    yield put(autofill(SAAS_EDITOR_FORM, "datasource", datasource));

    AnalyticsUtil.logEvent("SWITCH_DATASOURCE");

    return;
  }

  // Special handling of the case when the where clause row is added or removed
  if (
    actionPayload.type === ReduxFormActionTypes.ARRAY_REMOVE ||
    actionPayload.type === ReduxFormActionTypes.ARRAY_PUSH
  ) {
    // Sending only the value for the where clause rather than the payload
    const value = get(values, field);
    yield put(
      setActionProperty({
        actionId: values.id,
        propertyName: field,
        value,
      }),
    );
  } else {
    yield put(
      setActionProperty({
        actionId: values.id,
        propertyName: field,
        value: actionPayload.payload,
      }),
    );
  }
  yield put(updateReplayEntity(values.id, values, ENTITY_TYPE.ACTION));
}

export default function* root() {
  yield all([
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
      handleDatasourceCreatedSaga,
    ),
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleActionCreatedSaga),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    // Calling form valye change on adding/removing where clause statement
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
  ]);
}
