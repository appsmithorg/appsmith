import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import ActionEditorContextMenu from "./ActionEditorContextMenu";
import Editor from "pages/Editor/APIEditor/Editor";
import ModuleInputsForm from "./ModuleInputsForm";
import { getIsPackageEditorInitialized } from "@appsmith/selectors/packageSelectors";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import { noop } from "lodash";
import { ApiEditorContextProvider } from "pages/Editor/APIEditor/ApiEditorContext";
import { deleteModule, saveModuleName } from "@appsmith/actions/moduleActions";
import type { SaveModuleNamePayload } from "@appsmith/actions/moduleActions";
import type { PaginationField } from "api/ActionAPI";
import { runAction } from "actions/pluginActionActions";
import { getAction } from "@appsmith/selectors/entitiesSelector";
import Loader from "./Loader";

interface ModuleApiEditorRouteParams {
  packageId: string;
  moduleId: string;
  apiId?: string;
}

type ModuleApiEditorProps = RouteComponentProps<ModuleApiEditorRouteParams>;

function ModuleApiEditor(props: ModuleApiEditorProps) {
  const dispatch = useDispatch();
  const { apiId = "", moduleId } = props.match.params;

  const isPackageEditorInitialized = useSelector(getIsPackageEditorInitialized);
  const module = useSelector((state) => getModuleById(state, moduleId));
  const action = useSelector((state) => getAction(state, apiId));

  const isEditorInitialized = isPackageEditorInitialized && Boolean(action);

  const onDeleteModule = useCallback(() => {
    dispatch(deleteModule({ id: module?.id || "" }));
  }, [module?.id]);

  const moreActionsMenu = useMemo(() => {
    return (
      <ActionEditorContextMenu isDeletePermitted onDelete={onDeleteModule} />
    );
  }, []);

  const onSaveModuleName = useCallback(
    ({ name }: SaveModuleNamePayload) => {
      return saveModuleName({
        id: module?.id || "",
        name,
      });
    },
    [module?.id],
  );

  const actionRightPaneAdditionSections = useMemo(() => {
    if (!module?.inputsForm) {
      return null;
    }

    return (
      <ModuleInputsForm
        defaultValues={{ inputsForm: module?.inputsForm }}
        moduleId={module?.id}
      />
    );
  }, [[module?.id, module?.inputsForm]]);

  const handleRunClick = useCallback(
    (paginationField?: PaginationField) => {
      dispatch(runAction(apiId, paginationField));
    },
    [apiId],
  );

  if (!isEditorInitialized) {
    return <Loader />;
  }

  return (
    <ApiEditorContextProvider
      actionRightPaneAdditionSections={actionRightPaneAdditionSections}
      handleDeleteClick={noop}
      handleRunClick={handleRunClick}
      moreActionsMenu={moreActionsMenu}
      saveActionName={onSaveModuleName}
      settingsConfig={module?.settingsForm}
      showRightPaneTabbedSection={false}
    >
      <Editor {...props} isEditorInitialized={isPackageEditorInitialized} />
    </ApiEditorContextProvider>
  );
}

export default ModuleApiEditor;
