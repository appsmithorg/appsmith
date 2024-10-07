import { getFormValues } from "redux-form";
import type { WidgetBlueprint } from "WidgetProvider/constants";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetProps } from "widgets/BaseWidget";
import { generateReactKey } from "utils/generators";
import { call, put, select } from "redux-saga/effects";
import { get } from "lodash";
import WidgetFactory from "WidgetProvider/factory";

import type { WidgetType } from "constants/WidgetConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import * as log from "loglevel";
import { toast } from "@appsmith/ads";
import type { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { getUntitledDatasourceSequence } from "utils/DatasourceSagaUtils";
import { createTempDatasourceFromForm } from "actions/datasourceActions";
import type { CreateDatasourceConfig } from "../api/DatasourcesApi";
// import { createActionRequest } from "../actions/pluginActionActions";
import DatasourcesApi from "api/DatasourcesApi";
import type { Plugin } from "../api/PluginApi";
import { getDefaultEnvId } from "../ce/api/ApiUtils";
import { ReduxActionTypes } from "../ce/constants/ReduxActionConstants";
import {
  getDatasources,
  // getEntities,
  // getPlugin,
  // getPluginForm,
  // getPluginPackageFromDatasourceId,
  getPlugins,
} from "../ce/selectors/entitiesSelector";
import { getCurrentEnvironmentId } from "../ce/selectors/environmentSelectors";
import { getCurrentWorkspaceId } from "../ce/selectors/selectedWorkspaceSelectors";
import {
  DATASOURCE_NAME_DEFAULT_PREFIX,
  TEMP_DATASOURCE_ID,
} from "../constants/Datasource";
import { PluginName } from "../entities/Action";
import { type Datasource, ToastMessageType } from "../entities/Datasource";
import { getCurrentPageId } from "../selectors/editorSelectors";
import { getFormData } from "../selectors/formSelectors";
import { createDatasourceFromFormSaga } from "./DatasourcesSagas";

function buildView(view: WidgetBlueprint["view"], widgetId: string) {
  const children = [];

  if (view) {
    for (const template of view) {
      //TODO(abhinav): Can we keep rows and size mandatory?
      try {
        children.push({
          widgetId,
          type: template.type,
          leftColumn: template.position.left || 0,
          topRow: template.position.top || 0,
          columns: template.size && template.size.cols,
          rows: template.size && template.size.rows,
          newWidgetId: generateReactKey(),
          props: template.props,
        });
      } catch (e) {
        log.error(e);
      }
    }
  }

  return children;
}

export function* buildWidgetBlueprint(
  blueprint: WidgetBlueprint,
  widgetId: string,
) {
  const widgetProps: Record<string, unknown> = yield call(
    buildView,
    blueprint.view,
    widgetId,
  );

  return widgetProps;
}

export interface UpdatePropertyArgs {
  widgetId: string;
  propertyName: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any;
}
export type BlueprintOperationAddActionFn = () => void;
export type BlueprintOperationModifyPropsFn = (
  widget: WidgetProps & { children?: WidgetProps[] },
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  parent?: WidgetProps,
  layoutSystemType?: LayoutSystemTypes,
) => UpdatePropertyArgs[] | undefined;

export interface ChildOperationFnResponse {
  widgets: Record<string, FlattenedWidgetProps>;
  message?: string;
}

export type BlueprintOperationChildOperationsFn = (
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetId: string,
  parentId: string,
  widgetPropertyMaps: {
    defaultPropertyMap: Record<string, string>;
  },
  layoutSystemType: LayoutSystemTypes,
) => ChildOperationFnResponse;

export type BlueprintBeforeOperationsFn = (
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetId: string,
  parentId: string,
  layoutSystemType: LayoutSystemTypes,
) => void;

export type BlueprintOperationFunction =
  | BlueprintOperationModifyPropsFn
  | BlueprintOperationAddActionFn
  | BlueprintOperationChildOperationsFn
  | BlueprintBeforeOperationsFn;

export type BlueprintOperationType = keyof typeof BlueprintOperationTypes;

export interface BlueprintOperation {
  type: BlueprintOperationType;
  fn: BlueprintOperationFunction;
}

export function* executeWidgetBlueprintOperations(
  operations: BlueprintOperation[],
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetId: string,
) {
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);
  // const datasources: Datasource[] = yield select(getDatasources);
  const plugins: Plugin[] = yield select(getPlugins);
  // const { initialValues } = yield select(getFormData, DATASOURCE_DB_FORM);
  // const pluginId: string = yield select(
  //   getPluginIdOfPackageName,
  //   PluginPackageName.APPSMITH_AI,
  // );
  // const formConfig: Record<string, unknown>[] = yield select(
  //   getPluginForm,
  //   pluginId,
  // );
  //
  // const formData = yield select(getFormValues(QUERY_EDITOR_FORM_NAME));
  const pageId: string = yield select(getCurrentPageId);
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  // let currentEnvironment: string = yield select(getCurrentEnvironmentId);

  const dsList: Datasource[] = yield select(getDatasources);
  const sequence = getUntitledDatasourceSequence(dsList);
  const defaultEnvId = getDefaultEnvId();

  const plugin = plugins.find(
    (plugin: Plugin) => plugin.name === PluginName.APPSMITH_AI,
  );

  const payload = {
    id: TEMP_DATASOURCE_ID,
    name: DATASOURCE_NAME_DEFAULT_PREFIX + sequence,
    type: plugin!.type,
    pluginId: plugin!.id,
    new: false,
    workspaceId,
    datasourceStorages: {
      [defaultEnvId]: {
        datasourceId: TEMP_DATASOURCE_ID,
        environmentId: defaultEnvId,
        isValid: false,
        datasourceConfiguration: {
          url: "",
          properties: [],
        },
        toastMessage: ToastMessageType.EMPTY_TOAST_MESSAGE,
      },
    },
  };

  for (const operation of operations) {
    const widget: WidgetProps & { children?: string[] | WidgetProps[] } = {
      ...widgets[widgetId],
    };

    switch (operation.type) {
      case BlueprintOperationTypes.ADD_ACTION:
        yield createDatasourceFromFormSaga({
          payload,
          type: ReduxActionTypes.CREATE_DATASOURCE_FROM_FORM_INIT,
        });
        // yield put(
        //   createActionRequest({
        //     pageId,
        //     pluginId: datasources[0].pluginId,
        //     datasource: {
        //       id: datasources[0].id,
        //     },
        //     actionConfiguration: {
        //       formData: {
        //         usecase: { data: "TEXT_CLASSIFY" },
        //       },
        //     },
        //   }),
        // );
        break;
      case BlueprintOperationTypes.MODIFY_PROPS:
        if (widget.children && widget.children.length > 0) {
          widget.children = (widget.children as string[]).map(
            (childId: string) => widgets[childId],
          ) as WidgetProps[];
        }

        const updatePropertyPayloads: UpdatePropertyArgs[] | undefined = (
          operation.fn as BlueprintOperationModifyPropsFn
        )(
          widget as WidgetProps & { children?: WidgetProps[] },
          widgets,
          get(widgets, widget.parentId || "", undefined),
          layoutSystemType,
        );

        updatePropertyPayloads &&
          updatePropertyPayloads.forEach((params: UpdatePropertyArgs) => {
            widgets[params.widgetId][params.propertyName] =
              params.propertyValue;
          });
        break;
    }
  }

  const result: { [widgetId: string]: FlattenedWidgetProps } = yield widgets;

  return result;
}

/**
 * this saga executes the blueprint child operation
 *
 * @param parent
 * @param newWidgetId
 * @param widgets
 *
 * @returns { [widgetId: string]: FlattenedWidgetProps }
 */
export function* executeWidgetBlueprintChildOperations(
  operation: BlueprintOperation,
  canvasWidgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetIds: string[],
  parentId: string,
) {
  // TODO(abhinav): Special handling for child operaionts
  // This needs to be deprecated soon

  let widgets = canvasWidgets,
    message;
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);

  for (const widgetId of widgetIds) {
    // Get the default properties map of the current widget
    // The operation can handle things based on this map
    // Little abstraction leak, but will be deprecated soon
    const widgetPropertyMaps = {
      defaultPropertyMap: WidgetFactory.getWidgetDefaultPropertiesMap(
        canvasWidgets[widgetId].type as WidgetType,
      ),
    };

    let currMessage;

    ({ message: currMessage, widgets } = (
      operation.fn as BlueprintOperationChildOperationsFn
    )(widgets, widgetId, parentId, widgetPropertyMaps, layoutSystemType));

    //set message if one of the widget has any message to show
    if (currMessage) message = currMessage;
  }

  // If something odd happens show the message related to the odd scenario
  if (message) {
    toast.show(message, {
      kind: "info",
    });
  }

  // Flow returns to the usual from here.
  return widgets;
}

/**
 * this saga traverse the tree till we get
 * to MAIN_CONTAINER_WIDGET_ID while travesring, if we find
 * any widget which has CHILD_OPERATION, we will call the fn in it
 *
 * @param parent
 * @param newWidgetId
 * @param widgets
 *
 * @returns { [widgetId: string]: FlattenedWidgetProps }
 */
export function* traverseTreeAndExecuteBlueprintChildOperations(
  parent: FlattenedWidgetProps,
  newWidgetIds: string[],
  widgets: { [widgetId: string]: FlattenedWidgetProps },
) {
  let root = parent;

  while (root.parentId && root.widgetId !== MAIN_CONTAINER_WIDGET_ID) {
    const parentConfig = WidgetFactory.widgetConfigMap.get(root.type);

    // find the blueprint with type CHILD_OPERATIONS
    const blueprintChildOperation = get(
      parentConfig,
      "blueprint.operations",
      [],
    ).find(
      (operation: BlueprintOperation) =>
        operation.type === BlueprintOperationTypes.CHILD_OPERATIONS,
    );

    // if there is blueprint operation with CHILD_OPERATION type, call the fn in it
    if (blueprintChildOperation) {
      const updatedWidgets:
        | { [widgetId: string]: FlattenedWidgetProps }
        | undefined = yield call(
        executeWidgetBlueprintChildOperations,
        blueprintChildOperation,
        widgets,
        newWidgetIds,
        root.widgetId,
      );

      if (updatedWidgets) {
        widgets = updatedWidgets;
      }
    }

    root = widgets[root.parentId];
  }

  return widgets;
}

interface ExecuteWidgetBlueprintBeforeOperationsParams {
  parentId: string;
  widgetId: string;
  widgets: { [widgetId: string]: FlattenedWidgetProps };
  widgetType: WidgetType;
}

export function* executeWidgetBlueprintBeforeOperations(
  blueprintOperation: Extract<
    BlueprintOperationTypes,
    | BlueprintOperationTypes.BEFORE_ADD
    | BlueprintOperationTypes.BEFORE_DROP
    | BlueprintOperationTypes.BEFORE_PASTE
    | BlueprintOperationTypes.UPDATE_CREATE_PARAMS_BEFORE_ADD
  >,
  params: ExecuteWidgetBlueprintBeforeOperationsParams,
) {
  const { parentId, widgetId, widgets, widgetType } = params;
  const layoutSystemType: LayoutSystemTypes = yield select(getLayoutSystemType);
  const blueprintOperations: BlueprintOperation[] =
    WidgetFactory.widgetConfigMap.get(widgetType)?.blueprint?.operations ?? [];

  const beforeAddOperation = blueprintOperations.find(
    (operation) => operation.type === blueprintOperation,
  );

  if (beforeAddOperation)
    return (beforeAddOperation.fn as BlueprintBeforeOperationsFn)(
      widgets,
      widgetId,
      parentId,
      layoutSystemType,
    );
}
