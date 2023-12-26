import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { useHistory } from "react-router";
import { noop } from "lodash";

import ActionEditorContextMenu from "./ActionEditorContextMenu";
import Editor from "pages/Editor/QueryEditor/Editor";
import ModuleInputsForm from "./ModuleInputsForm";
import Loader from "./Loader";
import {
  changeQuery,
  setQueryPaneConfigSelectedTabIndex,
} from "actions/queryPaneActions";
import { getIsPackageEditorInitialized } from "@appsmith/selectors/packageSelectors";
import { QueryEditorContextProvider } from "pages/Editor/QueryEditor/QueryEditorContext";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import { deleteModule, saveModuleName } from "@appsmith/actions/moduleActions";
import type { SaveModuleNamePayload } from "@appsmith/actions/moduleActions";
import { builderURL } from "@appsmith/RouteBuilder";
import { getAction } from "@appsmith/selectors/entitiesSelector";
import { saveActionNameBasedOnParentEntity } from "@appsmith/actions/helpers";
import { ActionParentEntityType } from "@appsmith/entities/Engine/actionHelpers";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

interface ModuleQueryEditorRouteParams {
  pageId: string; // TODO: @ashit remove this and add generic key in the Editor
  packageId: string;
  moduleId: string;
  queryId?: string;
  apiId?: string;
}

type ModuleQueryEditorProps = RouteComponentProps<ModuleQueryEditorRouteParams>;

function ModuleQueryEditor(props: ModuleQueryEditorProps) {
  const dispatch = useDispatch();
  const history = useHistory();
  const { apiId, moduleId, packageId, queryId } = props.match.params;
  const actionId = queryId || apiId || "";

  const isPackageEditorInitialized = useSelector(getIsPackageEditorInitialized);
  const module = useSelector((state) => getModuleById(state, moduleId));
  const action = useSelector((state) => getAction(state, actionId));

  const isEditorInitialized = isPackageEditorInitialized && Boolean(action);

  useEffect(() => {
    /**
     * This is a hack to set the "Query" tab of the query editor.
     * Reason for hack:
     * 1. In the queryPaneReducer the selectedConfigTabIndex is "0" instead of 0 which makes the condition
     *  selectedConfigTab || EDITOR_TABS.QUERY in EditorJSONtoForm.tsx and nothing get's pre selected.
     * 2. This problem does not occur in App Editor because the contextSwitchingSaga force resets the
     *  selectedConfigTabIndex from "0" to 0 making the above condition work. The logic for context switch is
     *  currently not enabled for package editor.
     *
     * Until the above to problems are resolved then hack will work as a stop gap
     */
    dispatch(setQueryPaneConfigSelectedTabIndex(0 as any));
  }, []);

  const changeQueryPage = (queryId: string) => {
    dispatch(changeQuery({ id: queryId, moduleId, packageId }));
  };

  const onSaveName = useCallback(
    ({ name }: SaveModuleNamePayload) => {
      const isPublicEntity = action?.isPublic;
      return isPublicEntity
        ? saveModuleName({
            id: moduleId,
            name,
          })
        : saveActionNameBasedOnParentEntity(
            actionId,
            name,
            ActionParentEntityType.MODULE,
          );
    },
    [moduleId, action?.isPublic, actionId],
  );

  const onCreateDatasourceClick = () => {
    history.push(
      builderURL({
        suffix: "datasources/NEW",
        generateEditorPath: true,
      }),
    );
  };

  const onDeleteModule = useCallback(() => {
    dispatch(deleteModule({ id: module?.id || "" }));
  }, [module?.id]);

  const moreActionsMenu = useMemo(() => {
    return (
      <ActionEditorContextMenu isDeletePermitted onDelete={onDeleteModule} />
    );
  }, []);

  const actionRightPaneAdditionSections = useMemo(() => {
    if (!module?.inputsForm || !action?.isPublic) {
      return null;
    }

    return (
      <ModuleInputsForm
        defaultValues={{
          inputsForm: module?.inputsForm,
        }}
        moduleId={module?.id}
      />
    );
  }, [module?.id, module?.inputsForm, action?.isPublic]);

  if (!isEditorInitialized) {
    return <Loader />;
  }

  return (
    <QueryEditorContextProvider
      actionRightPaneAdditionSections={actionRightPaneAdditionSections}
      changeQueryPage={changeQueryPage}
      moreActionsMenu={moreActionsMenu}
      onCreateDatasourceClick={onCreateDatasourceClick}
      onEntityNotFoundBackClick={noop}
      saveActionName={onSaveName}
      showSuggestedWidgets={module?.type === MODULE_TYPE.UI}
    >
      <Editor
        {...props}
        isEditorInitialized={isEditorInitialized}
        settingsConfig={module?.settingsForm}
      />
    </QueryEditorContextProvider>
  );
}

export default ModuleQueryEditor;
