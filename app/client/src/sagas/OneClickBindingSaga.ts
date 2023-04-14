import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createActionRequest } from "actions/pluginActionActions";
import type { Plugin } from "api/PluginApi";
import type { Action } from "entities/Action";
import type { Datasource } from "entities/Datasource";
import { merge } from "lodash";
import { log } from "loglevel";
import { all, call, select, takeLatest } from "redux-saga/effects";
import { getCurrentPageId } from "selectors/editorSelectors";
import {
  getActions,
  getDatasource,
  getPlugin,
} from "selectors/entitiesSelector";
import type { EventLocation } from "utils/AnalyticsUtil";
import { createNewQueryName } from "utils/AppsmithUtils";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import {
  createActionsForOneClickBindingSaga,
  createDefaultActionPayload,
  getPulginDefaultValues,
} from "./ActionSagas";
import "../WidgetQueryGenerators";
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";

export function* createActionsFromFormConfig(
  action: ReduxAction<{
    datasourceId: string;
    formConfig: Record<string, any>;
    from: EventLocation;
  }>,
) {
  const { datasourceId, formConfig } = action.payload;

  if (!datasourceId) return;

  const pageId: string = yield select(getCurrentPageId);
  //merge the current page id with the create action payload
  const createActionPayload: Partial<Action> = yield call(
    createDefaultActionPayload,
    {
      ...action,
      payload: {
        ...action.payload,
        pageId,
      },
    },
  );
  const actions: ActionDataState = yield select(getActions);

  const datasource: Datasource = yield select(getDatasource, datasourceId);
  const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);

  const QueryAdaptor = WidgetQueryGeneratorRegistry.get(plugin.packageName);

  //get default initial values pertaining to a plugin
  const defaultValues: object | undefined = yield call(
    getPulginDefaultValues,
    datasource?.pluginId,
  );

  //generate corresponding action payloads
  const actionPayloads = QueryAdaptor.build(formConfig, defaultValues);
  //if there is no actions to be created just return
  if (!actionPayloads || !actionPayloads.length) {
    return { status: "success" };
  }

  type ActionRequestType = { payload: Partial<Action>; type: string };
  //generate action payloads
  const actionRequestPayloads = actionPayloads.reduce(
    (
      acc: ActionRequestType[],
      curr: { actionPayload: object; actionTitle: string },
    ) => {
      const { actionPayload, actionTitle } = curr;
      //for all newly generated actions consider them as part of the actions state
      //this is necessary as we can get the incremented query name and not generate duplicate one
      const newActions = acc.map((val) => ({
        config: val.payload,
      }));
      const allActions = [...actions, ...newActions] as ActionDataState;
      const payload: Partial<Action> = merge({}, createActionPayload, {
        actionConfiguration: actionPayload,
        //merge the next query names to the default payload
        name: createNewQueryName(allActions, pageId || "", actionTitle),
      });

      acc.push(createActionRequest(payload));
      return acc;
    },
    [],
  );

  //call create actions in parallel and get their status
  const results: {
    status: string;
  }[] = yield all(
    actionRequestPayloads.map(
      (
        request: ReduxAction<
          Partial<Action> & { eventData: any; pluginId: string }
        >,
      ) => call(createActionsForOneClickBindingSaga, request),
    ),
  );

  //check the return value of the saga to see if there is any failure
  const hasAFailureInActionCreations = results.some(
    (result) => result?.status === "failure",
  );

  //orchestrator saga can check status of this saga from the returned value
  if (hasAFailureInActionCreations) {
    return { status: "failure" };
  }
  return { status: "success" };
}

function* BindWidgetToDatasource(action: ReduxAction<unknown>) {
  log(action.payload);
}

export default function* oneClickBindingSaga() {
  yield all([
    takeLatest(
      ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE,
      BindWidgetToDatasource,
    ),
  ]);
}
