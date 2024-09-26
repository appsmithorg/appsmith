import React from "react";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "../navigation/FocusEntity";
import { useSelector } from "react-redux";
import {
  getActionByBaseId,
  getActionResponses,
  getDatasource,
  getEditorConfig,
  getPlugin,
} from "ee/selectors/entitiesSelector";
import { PluginActionContextProvider } from "./PluginActionContext";
import { get } from "lodash";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import Spinner from "components/editorComponents/Spinner";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { Text } from "@appsmith/ads";
import { useIsEditorInitialised } from "IDE/hooks";
import { useActionSettingsConfig } from "./hooks";

interface ChildrenProps {
  children: React.ReactNode | React.ReactNode[];
}

const PluginActionEditor = (props: ChildrenProps) => {
  const { pathname } = useLocation();

  const isEditorInitialized = useIsEditorInitialised();

  const entity = identifyEntityFromPath(pathname);
  const action = useSelector((state) => getActionByBaseId(state, entity.id));

  const pluginId = get(action, "pluginId", "");
  const plugin = useSelector((state) => getPlugin(state, pluginId));

  const datasourceId = get(action, "datasource.id", "");
  const datasource = useSelector((state) => getDatasource(state, datasourceId));

  const settingsConfig = useActionSettingsConfig(action);

  const editorConfig = useSelector((state) => getEditorConfig(state, pluginId));

  const actionResponses = useSelector(getActionResponses);

  if (!isEditorInitialized) {
    return (
      <CenteredWrapper>
        <Spinner size={30} />
      </CenteredWrapper>
    );
  }

  if (!action) {
    return <EntityNotFoundPane />;
  }

  if (!plugin) {
    return (
      <CenteredWrapper>
        <Text color="var(--ads-v2-color-fg-error)" kind="heading-m">
          Plugin not installed!
        </Text>
      </CenteredWrapper>
    );
  }

  if (!settingsConfig || !editorConfig) {
    return (
      <CenteredWrapper>
        <Text color="var(--ads-v2-color-fg-error)" kind="heading-m">
          Editor config not found!
        </Text>
      </CenteredWrapper>
    );
  }

  const actionResponse = actionResponses[action.id];

  return (
    <PluginActionContextProvider
      action={action}
      actionResponse={actionResponse}
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
