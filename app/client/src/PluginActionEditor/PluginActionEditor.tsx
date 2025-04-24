import React from "react";
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
import { createMessage, PLUGIN_NOT_INSTALLED } from "ee/constants/messages";
import { ShowUpgradeMenuItem } from "ee/utils/licenseHelpers";

interface ChildrenProps {
  children: React.ReactNode | React.ReactNode[];
  actionId: string;
}

const PluginActionEditor = (props: ChildrenProps) => {
  const isEditorInitialized = useIsEditorInitialised();

  const action = useSelector((state) =>
    getActionByBaseId(state, props.actionId),
  );

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
      <CenteredWrapper className="flex-col">
        <Text color="var(--ads-v2-color-fg-error)" kind="heading-m">
          {createMessage(PLUGIN_NOT_INSTALLED)}
        </Text>
        <ShowUpgradeMenuItem />
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
