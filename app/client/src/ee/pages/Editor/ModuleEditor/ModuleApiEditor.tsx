import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";

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
import ActionEditorContextMenu from "./ActionEditorContextMenu";

interface ModuleApiEditorRouteParams {
  packageId: string;
  moduleId: string;
  apiId?: string;
}

type ModuleApiEditorProps = RouteComponentProps<ModuleApiEditorRouteParams>;

function ModuleApiEditor(props: ModuleApiEditorProps) {
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

  const moreActionsMenu = useMemo(() => {
    return <ActionEditorContextMenu isDeletePermitted onDelete={noop} />;
  }, []);

  return (
    <ApiEditorContextProvider
      handleDeleteClick={noop}
      handleRunClick={noop}
      moreActionsMenu={moreActionsMenu}
      settingsConfig={whitelistedSettingsConfig}
    >
      <Editor {...props} isEditorInitialized={isPackageEditorInitialized} />
    </ApiEditorContextProvider>
  );
}

export default ModuleApiEditor;
