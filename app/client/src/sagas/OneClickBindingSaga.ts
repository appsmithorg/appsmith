import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { Plugin } from "api/PluginApi";
import {
  ActionCreationSourceTypeEnum,
  ActionExecutionContext,
  PluginType,
  type Action,
  type QueryActionConfig,
} from "entities/Action";
import type { Datasource } from "entities/Datasource";
import { invert, merge, omit, partition } from "lodash";
import { all, call, put, select, take, takeLatest } from "redux-saga/effects";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getActions,
  getCurrentPageNameByActionId,
  getDatasource,
  getPlugin,
} from "ee/selectors/entitiesSelector";
import { createNewApiName, createNewQueryName } from "utils/AppsmithUtils";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import {
  createDefaultActionPayloadWithPluginDefaults,
  getPluginActionDefaultValues,
} from "./ActionSagas";
import "../WidgetQueryGenerators";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import "WidgetQueryGenerators";
import { getWidgetByID } from "./selectors";
import type {
  WidgetQueryConfig,
  WidgetQueryGenerationFormConfig,
} from "WidgetQueryGenerators/types";
import { QUERY_TYPE } from "WidgetQueryGenerators/types";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ApiResponse } from "api/ApiResponses";
import type { ActionCreateUpdateResponse } from "api/ActionAPI";
import ActionAPI from "api/ActionAPI";
import { validateResponse } from "./ErrorSagas";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { fetchActions, runAction } from "actions/pluginActionActions";
import { toast } from "@appsmith/ads";
import WidgetFactory from "WidgetProvider/factory";

export function* createActionsForOneClickBindingSaga(
  payload: Partial<Action> & { eventData: unknown; pluginId: string },
) {
  try {
    // Indicates that source of action creation is one click binding
    payload.source = ActionCreationSourceTypeEnum.ONE_CLICK_BINDING;

    const response: ApiResponse<ActionCreateUpdateResponse> | undefined =
      yield ActionAPI.createAction(payload);

    if (!response) {
      return false;
    }

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
    return false;
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

  const newActions: string[] = [];

  try {
    const defaultValues: object | undefined = yield call(
      getPluginActionDefaultValues,
      datasource?.pluginId,
    );

    const { getQueryGenerationConfig } = WidgetFactory.getWidgetMethods(
      widget.type,
    );

    const widgetQueryGenerationConfig = getQueryGenerationConfig?.(
      widget,
      action.payload,
    );

    const widgetQueryGenerator = WidgetQueryGeneratorRegistry.get(
      plugin.packageName,
    );

    const actionConfigurationList = widgetQueryGenerator.build(
      widgetQueryGenerationConfig,
      action.payload,
      defaultValues,
    );

    const newActionName =
      plugin.type === PluginType.DB
        ? createNewQueryName(actions, pageId || "")
        : createNewApiName(actions, pageId || "");

    const commonActionPayload: Partial<Action> = yield call(
      createDefaultActionPayloadWithPluginDefaults,
      {
        datasourceId,
        from: "ONE_CLICK_BINDING",
        newActionName,
      },
    );

    const queryNameMap: Record<string, string> = {};

    const actionRequestPayloadList: Partial<Action> &
      { eventData: unknown; pluginId: string; type: QUERY_TYPE }[] =
      actionConfigurationList.map(
        (action: {
          payload: QueryActionConfig;
          dynamicBindingPathList: unknown;
          name: string;
          type: QUERY_TYPE;
        }) => {
          const { dynamicBindingPathList, name, payload, type } = action;

          queryNameMap[type] = createNewQueryName(actions, pageId || "", name);

          return merge(
            {},
            {
              ...commonActionPayload,
              pageId,
            },
            {
              actionConfiguration: payload,
              name: queryNameMap[type],
              dynamicBindingPathList,
              type,
            },
          );
        },
      );

    /*
     *  Select query is created and bound first so table widget can
     *  create columns
     */
    const groupedPayloadList = partition(actionRequestPayloadList, (d) =>
      [QUERY_TYPE.SELECT, QUERY_TYPE.TOTAL_RECORD].includes(d.type),
    );

    for (const payloadList of groupedPayloadList) {
      const createdActions: Action[] = yield all(
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
        throw new Error("Unable to fetch newly created actions");
      }

      const actionsToRun = createdActions.filter(
        (action) =>
          action.name === queryNameMap[QUERY_TYPE.SELECT] ||
          action.name === queryNameMap[QUERY_TYPE.TOTAL_RECORD],
      );

      //TODO(Balaji): Need to make changes to plugin saga to execute the actions in parallel
      for (const actionToRun of actionsToRun) {
        yield put(
          runAction(
            actionToRun.id,
            undefined,
            true,
            undefined,
            ActionExecutionContext.ONE_CLICK_BINDING,
          ),
        );

        const runResponse: ReduxAction<unknown> = yield take([
          ReduxActionTypes.RUN_ACTION_SUCCESS,
          ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR,
          ReduxActionErrorTypes.RUN_ACTION_ERROR,
        ]);

        if (
          [
            ReduxActionErrorTypes.EXECUTE_PLUGIN_ACTION_ERROR,
            ReduxActionErrorTypes.RUN_ACTION_ERROR,
          ].includes(runResponse.type)
        ) {
          throw new Error(`Unable to run action: ${actionToRun.name}`);
        }
      }

      const { getPropertyUpdatesForQueryBinding } =
        WidgetFactory.getWidgetMethods(widget.type);

      const createdQueryNames = createdActions.map((d) => d.name);

      const queryBindingConfig: WidgetQueryConfig = {};

      const { alertMessage } = action.payload;

      if (createdQueryNames.includes(queryNameMap[QUERY_TYPE.SELECT])) {
        queryBindingConfig[QUERY_TYPE.SELECT] = {
          data: `{{${queryNameMap[QUERY_TYPE.SELECT]}.data}}`,
          run: `{{
            ${queryNameMap[QUERY_TYPE.SELECT]}.run();
            ${
              createdQueryNames.includes(queryNameMap[QUERY_TYPE.TOTAL_RECORD])
                ? queryNameMap[QUERY_TYPE.TOTAL_RECORD] + ".run()"
                : ""
            }
          }}`,
        };
      }

      if (createdQueryNames.includes(queryNameMap[QUERY_TYPE.UPDATE])) {
        const selectQuery = queryNameMap[QUERY_TYPE.SELECT]
          ? `${queryNameMap[QUERY_TYPE.SELECT]}.run()`
          : "";

        const successMessage = `${
          alertMessage?.success
            ? alertMessage.success?.update
            : "Successfully saved!"
        }`;

        queryBindingConfig[QUERY_TYPE.UPDATE] = {
          data: `{{${queryNameMap[QUERY_TYPE.UPDATE]}.data}}`,
          run: `{{${queryNameMap[QUERY_TYPE.UPDATE]}.run(() => {
            showAlert("${successMessage}");
            ${selectQuery.toString()}
          }, () => {
            showAlert("Unable to save!");
          })}}`,
        };
      }

      if (createdQueryNames.includes(queryNameMap[QUERY_TYPE.CREATE])) {
        const selectQuery = queryNameMap[QUERY_TYPE.SELECT]
          ? `${queryNameMap[QUERY_TYPE.SELECT]}.run()`
          : "";

        const successMessage = `${
          alertMessage?.success
            ? alertMessage.success?.create
            : "Successfully created!"
        }`;

        queryBindingConfig[QUERY_TYPE.CREATE] = {
          data: `{{${queryNameMap[QUERY_TYPE.CREATE]}.data}}`,
          run: `{{${queryNameMap[QUERY_TYPE.CREATE]}.run(() => {
            showAlert("${successMessage}");
            ${selectQuery.toString()}
          }, () => {
            showAlert("Unable to create!");
          })}}`,
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

      const { dynamicUpdates, modify } =
        getPropertyUpdatesForQueryBinding?.(
          queryBindingConfig,
          updatedWidget,
          action.payload,
        ) || {};

      yield put({
        type: ReduxActionTypes.BATCH_UPDATE_WIDGET_PROPERTY,
        payload: {
          widgetId,
          updates: {
            modify,
          },
          dynamicUpdates,
        },
      });

      yield take(ReduxActionTypes.SET_EVALUATED_TREE);

      newActions.push(...createdQueryNames);

      for (const action of createdActions) {
        AnalyticsUtil.logEvent("QUERY_GENERATION_BINDING_SUCCESS", {
          widgetName: widget.widgetName,
          widgetType: widget.type,
          QueryName: action.name,
          QueryType: invert(queryNameMap)[action.name],
          pluginType: plugin.type,
          pluginName: plugin.name,
        });
      }
    }

    yield put({
      type: ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_SUCCESS,
    });
    const { otherFields } = action.payload;
    AnalyticsUtil.logEvent("1_CLICK_BINDING_SUCCESS", {
      widgetName: widget.widgetName,
      widgetType: widget.type,
      pluginType: plugin.type,
      pluginName: plugin.name,
      isMock: datasource.isMock,
      formType: otherFields?.formType,
    });
  } catch (e: unknown) {
    yield put({
      type: ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE_ERROR,
      payload: {
        show: true,
        error: {
          message: e instanceof Error ? e.message : "Failed to Bind to widget",
        },
      },
    });
  }

  toast.show(
    `Successfully created action${
      newActions.length > 1 ? "s" : ""
    }: ${newActions.join(", ")}`,
    {
      hideProgressBar: true,
      kind: "success",
      autoClose: 3000,
    },
  );
}

export default function* oneClickBindingSaga() {
  yield all([
    takeLatest(
      ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE,
      BindWidgetToDatasource,
    ),
  ]);
}
