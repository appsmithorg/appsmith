import {
  CreateNewActionKey,
  type ActionParentEntityTypeInterface,
  type CreateNewActionKeyInterface,
} from "@appsmith/entities/Engine/actionHelpers";
import { getWorkflowsList } from "@appsmith/selectors/workflowSelectors";
import {
  SEARCH_ITEM_TYPES,
  type ActionOperation,
} from "components/editorComponents/GlobalSearch/utils";
import { FocusEntity } from "navigation/FocusEntity";
import { useSelector } from "react-redux";
import type { EventLocation } from "./analyticsUtilTypes";
import { WorkflowIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { createWorkflowExecutionActionBasedOnEditorType } from "@appsmith/actions/helpers";
import { PluginPackageName } from "entities/Action";
import { getPluginIdOfPackageName } from "sagas/selectors";
import type { AppState } from "@appsmith/reducers";
import { getShowWorkflowFeature } from "@appsmith/selectors/workflowSelectors";
import urlBuilder, {
  EDITOR_TYPE,
} from "@appsmith/entities/URLRedirect/URLAssembly";
import type { ActionDataState } from "@appsmith/reducers/entityReducers/actionsReducer";
import { getNextEntityName } from "utils/AppsmithUtils";

const icon = WorkflowIcon();

export const createNewWorkflowQueryName = (
  actions: ActionDataState,
  entityId: string,
  key: CreateNewActionKeyInterface = CreateNewActionKey.PAGE,
) => {
  const pageWorkflowsQueryNames = actions
    .filter((a: any) => a.config[key] === entityId)
    .map((a) => a.config.name);
  return getNextEntityName("WorkflowsQuery", pageWorkflowsQueryNames);
};

export const useWorkflowOptions = () => {
  const allWorkflows = useSelector(getWorkflowsList);
  const workflowPlugin = useSelector((state: AppState) =>
    getPluginIdOfPackageName(state, PluginPackageName.WORKFLOW),
  );
  const showWorkflowFeature = useSelector(getShowWorkflowFeature);
  const workflowOptions: ActionOperation[] = [];
  if (
    showWorkflowFeature &&
    !!workflowPlugin &&
    Object.keys(allWorkflows).length > 0 &&
    // We don't want to show the workflow query option if the user is already in the workflow editor
    urlBuilder.getDefaultEditorType() !== EDITOR_TYPE.WORKFLOW
  ) {
    workflowOptions.push({
      title: "Workflows Query",
      desc: "Create a new workflow query",
      icon,
      kind: SEARCH_ITEM_TYPES.actionOperation,
      action: (
        entityId: string,
        location: EventLocation,
        entityType?: ActionParentEntityTypeInterface,
      ) =>
        createWorkflowExecutionActionBasedOnEditorType(
          entityId,
          location,
          entityType,
        ),
      focusEntityType: FocusEntity.QUERY,
    });
  }
  return workflowOptions;
};
