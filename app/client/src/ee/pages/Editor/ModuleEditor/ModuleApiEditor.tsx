import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

import ActionEditorContextMenu from "./ActionEditorContextMenu";
import Editor from "pages/Editor/APIEditor/Editor";
import { getIsPackageEditorInitialized } from "@appsmith/selectors/packageSelectors";
import { getModuleById } from "@appsmith/selectors/modulesSelector";
import {
  getAction,
  getPluginSettingConfigs,
} from "@appsmith/selectors/entitiesSelector";
import { noop } from "lodash";
import { ApiEditorContextProvider } from "pages/Editor/APIEditor/ApiEditorContext";
import { filterWhitelistedConfig } from "./helper";
import { deleteModule, saveModuleName } from "@appsmith/actions/moduleActions";
import type { SaveModuleNamePayload } from "@appsmith/actions/moduleActions";
import ModuleInputsForm from "./ModuleInputsForm";

interface ModuleApiEditorRouteParams {
  packageId: string;
  moduleId: string;
  apiId?: string;
}

type ModuleApiEditorProps = RouteComponentProps<ModuleApiEditorRouteParams>;

function ModuleApiEditor(props: ModuleApiEditorProps) {
  const dispatch = useDispatch();
  const { apiId, moduleId } = props.match.params;

  const isPackageEditorInitialized = useSelector(getIsPackageEditorInitialized);
  const module = useSelector((state) => getModuleById(state, moduleId));

  const actionId = apiId || "";
  const action = useSelector((state) => getAction(state, actionId));

  const pluginId = action?.pluginId || "";
  const settingsConfig = useSelector((state) =>
    getPluginSettingConfigs(state, pluginId),
  );

  const whitelistedSettingsConfig = useMemo(() => {
    return filterWhitelistedConfig(
      settingsConfig,
      module?.whitelistedPublicEntitySettingsForModule,
    );
  }, [module?.whitelistedPublicEntitySettingsForModule, settingsConfig]);

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

  return (
    <ApiEditorContextProvider
      actionRightPaneAdditionSections={actionRightPaneAdditionSections}
      handleDeleteClick={noop}
      handleRunClick={noop}
      moreActionsMenu={moreActionsMenu}
      saveActionName={onSaveModuleName}
      settingsConfig={whitelistedSettingsConfig}
      showRightPaneTabbedSection={false}
    >
      <Editor {...props} isEditorInitialized={isPackageEditorInitialized} />
    </ApiEditorContextProvider>
  );
}

export default ModuleApiEditor;
