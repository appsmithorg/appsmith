import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionErrorTypes } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Plugin } from "api/PluginApi";
import type { Action } from "entities/Action";
import type { Datasource } from "entities/Datasource";
import { merge, omit, partition } from "lodash";
import { all, call, put, select, takeLatest, take } from "redux-saga/effects";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getActions,
  getCurrentPageNameByActionId,
  getDatasource,
  getPlugin,
} from "selectors/entitiesSelector";
import { createNewQueryName } from "utils/AppsmithUtils";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import {
  createDefaultActionPayload,
  getPulginActionDefaultValues,
} from "./ActionSagas";
import "../WidgetQueryGenerators";
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";
import "WidgetQueryGenerators";
import { getWidgetByID } from "./selectors";
import type { WidgetQueryGenerationFormConfig } from "WidgetQueryGenerators/types";
import { QUERY_TYPE } from "WidgetQueryGenerators/types";
import WidgetFactory from "utils/WidgetFactory";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ApiResponse } from "api/ApiResponses";
import type { ActionCreateUpdateResponse } from "api/ActionAPI";
import ActionAPI from "api/ActionAPI";
import { validateResponse } from "./ErrorSagas";
import AnalyticsUtil from "utils/AnalyticsUtil";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { fetchActions, runAction } from "actions/pluginActionActions";
import { Toaster, Variant } from "design-system-old";

export function* createActionsForOneClickBindingSaga(
  payload: Partial<Action> & { eventData: any; pluginId: string },
) {
  try {
    const response: ApiResponse<ActionCreateUpdateResponse> | undefined =
      yield ActionAPI.createAction(payload);

    if (!response) return { status: "failure" };

    const isValidResponse: boolean = yield validateResponse(response);
    if (isValidResponse) {
      const pageName: string = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      AnalyticsUtil.logEvent("CREATE_ACTION", {
        id: response.data.id,
        // @ts-expect-error: name does not exists on type ActionCreateUpdateResponse
        actionName: response.data.name,
        pageName: pageName,
        ...payload.eventData,
      });

      AppsmithConsole.info({
        text: `Action created from one click binding`,
        source: {
          type: ENTITY_TYPE.ACTION,
          id: response.data.id,
          // @ts-expect-error: name does not exists on type ActionCreateUpdateResponse
          name: response.data.name,
        },
      });
      return response.data;
    }
  } catch (e) {
    return;
  }
}

function* BindWidgetToDatasource(
  action: ReduxAction<WidgetQueryGenerationFormConfig>,
) {
  const { datasourceId, widgetId } = action.payload;

  const pageId: string = yield select(getCurrentPageId);

  const actions: ActionDataState = yield select(getActions);

  const datasource: Datasource = yield select(getDatasource, datasourceId);

  const plugin: Plugin = yield select(getPlugin, datasource?.pluginId);

  const widget: WidgetProps = yield select(getWidgetByID(widgetId));

  const applicationId: string = yield select(getCurrentApplicationId);

  try {
    const defaultValues: object | undefined = yield call(
      getPulginActionDefaultValues,
      datasource?.pluginId,
    );

    const { getQueryGenerationConfig } = WidgetFactory.getWidgetMethods(
      widget.type,
    );

    const widgetQueryGenerationConfig = getQueryGenerationConfig(widget);

    const widgetQueryGenerator = WidgetQueryGeneratorRegistry.get(
      plugin.packageName,
    );

    const actionConfigurationList = widgetQueryGenerator.build(
      widgetQueryGenerationConfig,
      action.payload,
      defaultValues,
    );

    const commonActionPayload: Partial<Action> = yield call(
      createDefaultActionPayload,
      pageId,
      datasourceId,
    );

    const queryNameMap: Record<string, string> = {};

    const actionRequestPayloadList: Partial<Action> &
      { eventData: any; pluginId: string; type: QUERY_TYPE }[] =
      actionConfigurationList.map(
        (action: {
          payload: any;
          dynamicBindingPathList: any;
          name: string;
          type: QUERY_TYPE;
        }) => {
          const { dynamicBindingPathList, name, payload, type } = action;

          queryNameMap[type] = createNewQueryName(actions, pageId || "", name);

          return merge({}, commonActionPayload, {
            actionConfiguration: payload,
            name: queryNameMap[type],
            dynamicBindingPathList,
            type,
          });
        },
      );

    /*
     *  Select query is created and bound first so table widget can
     *  create columns
     */
    const groupedPayloadList = partition(
      actionRequestPayloadList,
      (d) => d.type === QUERY_TYPE.SELECT,
    );

    for (const payloadList of groupedPayloadList) {
      const createdActions: any[] = yield all(
        payloadList.map((payload) =>
          call(createActionsForOneClickBindingSaga, omit(payload, "type")),
        ),
      );

      if (createdActions.some((action) => !action)) {
        throw new Error("Unable to create Actions");
      }

      yield put(fetchActions({ applicationId }, []));

      const fetchAction: ReduxAction<unknown> = yield take([
        ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
        ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      ]);

      if (fetchAction.type === ReduxActionErrorTypes.FETCH_ACTIONS_ERROR) {
        throw new Error("Unable to featch newly created actions");
      }

      Toaster.show({
        text: `Successfully created action${
          createdActions.length > 1 ? "s" : ""
        }: ${createdActions.map((d) => d.name)}`,
        hideProgressBar: false,
        variant: Variant.success,
      });

      const actionsToRun = createdActions.filter(
        (action) =>
          action.name === queryNameMap[QUERY_TYPE.SELECT] ||
          action.name === queryNameMap[QUERY_TYPE.TOTAL_RECORD],
      );

      for (const action of actionsToRun) {
        yield put(runAction(action.id, undefined, true));
      }

      const { getPropertyUpdatesForQueryBinding } =
        WidgetFactory.getWidgetMethods(widget.type);

      const createdQueryNames = createdActions.map((d) => d.name);

      const queryBindingConfig: Record<string, unknown> = {};

      if (createdQueryNames.includes(queryNameMap[QUERY_TYPE.SELECT])) {
        queryBindingConfig[QUERY_TYPE.SELECT] = {
          data: `{{${queryNameMap[QUERY_TYPE.SELECT]}.data}}`,
          run: `{{${queryNameMap[QUERY_TYPE.SELECT]}.run()}}`,
        };
      }

      if (createdQueryNames.includes(queryNameMap[QUERY_TYPE.UPDATE])) {
        queryBindingConfig[QUERY_TYPE.UPDATE] = {
          data: `{{${queryNameMap[QUERY_TYPE.UPDATE]}.data}}`,
          run: `{{${queryNameMap[QUERY_TYPE.UPDATE]}.run(() => ${
            queryNameMap[QUERY_TYPE.SELECT]
          }.run())}}`,
        };
      }

      if (createdQueryNames.includes(queryNameMap[QUERY_TYPE.CREATE])) {
        queryBindingConfig[QUERY_TYPE.CREATE] = {
          data: `{{${queryNameMap[QUERY_TYPE.CREATE]}.data}}`,
          run: `{{${queryNameMap[QUERY_TYPE.CREATE]}.run(() => ${
            queryNameMap[QUERY_TYPE.SELECT]
          }.run())}}`,
        };
      }

      if (createdQueryNames.includes(queryNameMap[QUERY_TYPE.TOTAL_RECORD])) {
        queryBindingConfig[QUERY_TYPE.TOTAL_RECORD] = {
          data: `{{${widgetQueryGenerator.getTotalRecordExpression(
            `${queryNameMap[QUERY_TYPE.TOTAL_RECORD]}.data`,
          )}}}`,
          run: `{{${queryNameMap[QUERY_TYPE.TOTAL_RECORD]}.run()}}`,
        };
      }

      const updatedWidget: WidgetProps = yield select(getWidgetByID(widgetId));

      const updates = getPropertyUpdatesForQueryBinding(
        queryBindingConfig,
        updatedWidget,
        action.payload,
      );

      yield put({
        type: ReduxActionTypes.BATCH_UPDATE_WIDGET_PROPERTY,
        payload: {
          widgetId,
          updates: {
            modify: updates,
          },
        },
      });

      yield take(ReduxActionTypes.SET_EVALUATED_TREE);

      Toaster.show({
        text: `Successfully bound action${
          createdActions.length > 1 ? "s" : ""
        }: ${createdActions.map((d) => d.name)} to widget - ${
          updatedWidget.widgetName
        }`,
        hideProgressBar: false,
        variant: Variant.success,
      });
    }

    yield put({
      type: ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_SUCCESS,
    });
  } catch (e: any) {
    Toaster.show({
      text: e.message,
      hideProgressBar: false,
      variant: Variant.danger,
    });

    yield put({
      type: ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_ERROR,
    });
  }
}

export default function* oneClickBindingSaga() {
  yield all([
    takeLatest(
      ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE,
      BindWidgetToDatasource,
    ),
  ]);
}
