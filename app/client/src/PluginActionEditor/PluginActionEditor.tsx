import React from "react";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "../navigation/FocusEntity";
import { useSelector } from "react-redux";
import {
  getActionByBaseId,
  getDatasource,
  getEditorConfig,
  getPlugin,
  getPluginSettingConfigs,
} from "ee/selectors/entitiesSelector";
import { PluginActionContextProvider } from "./PluginActionContext";
import { get } from "lodash";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { getIsEditorInitialized } from "selectors/editorSelectors";
import Spinner from "components/editorComponents/Spinner";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";

interface ChildrenProps {
  children: React.ReactNode[];
}

const PluginActionEditor = (props: ChildrenProps) => {
  const { pathname } = useLocation();

  const isEditorInitialized = useSelector(getIsEditorInitialized);

  const entity = identifyEntityFromPath(pathname);
  const action = useSelector((state) => getActionByBaseId(state, entity.id));

  const pluginId = get(action, "pluginId", "");
  const plugin = useSelector((state) => getPlugin(state, pluginId));

  const datasourceId = get(action, "datasource.id", "");
  const datasource = useSelector((state) => getDatasource(state, datasourceId));

  const settingsConfig = useSelector((state) =>
    getPluginSettingConfigs(state, pluginId),
  );

  const editorConfig = useSelector((state) => getEditorConfig(state, pluginId));

  if (!isEditorInitialized) {
    return (
      <CenteredWrapper>
        <Spinner size={30} />
      </CenteredWrapper>
    );
  }

  if (!action || !plugin) {
    // Handle not found
    return <EntityNotFoundPane />;
  }
  if (!settingsConfig || !editorConfig) {
    throw Error("Plugin config for action not found");
  }

  return (
    <PluginActionContextProvider
      action={action}
      datasource={datasource}
      editorConfig={editorConfig}
      plugin={plugin}
      settingsConfig={settingsConfig}
    >
      {props.children}
    </PluginActionContextProvider>
  );
};

export default PluginActionEditor;
