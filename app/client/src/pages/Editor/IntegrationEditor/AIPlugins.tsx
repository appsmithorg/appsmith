import React from "react";
import { connect } from "react-redux";
import { createTempDatasourceFromForm } from "actions/datasourceActions";
import type { AppState } from "ee/reducers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { type Plugin, PluginType } from "entities/Plugin";
import { getAssetUrl, isAirgapped } from "ee/utils/airgapHelpers";
import {
  DatasourceContainer,
  DatasourceSection,
  DatasourceSectionHeading,
  StyledDivider,
} from "./IntegrationStyledComponents";
import DatasourceItem from "./DatasourceItem";
import {
  CREATE_NEW_AI_SECTION_HEADER,
  createMessage,
} from "ee/constants/messages";
import { pluginSearchSelector } from "./CreateNewDatasourceHeader";
import { getPlugins } from "ee/selectors/entitiesSelector";

interface CreateAIPluginsProps {
  pageId: string;
  isCreating?: boolean;
  showUnsupportedPluginDialog: (callback: () => void) => void;

  plugins: Plugin[];
  createTempDatasourceFromForm: typeof createTempDatasourceFromForm;
}

function AIDataSources(props: CreateAIPluginsProps) {
  const { plugins } = props;

  const handleOnClick = (plugin: Plugin) => {
    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      pluginName: plugin.name,
      pluginPackageName: plugin.packageName,
    });

    props.createTempDatasourceFromForm({
      pluginId: plugin.id,
      type: plugin.type,
    });
  };

  return (
    <DatasourceContainer data-testid="newai-datasource-card-container">
      {plugins.map((plugin) => (
        <DatasourceItem
          className={`t--createBlankApi-${plugin.packageName}`}
          handleOnClick={() => {
            handleOnClick(plugin);
          }}
          icon={getAssetUrl(plugin.iconLocation)}
          key={plugin.id}
          name={plugin.name}
        />
      ))}
    </DatasourceContainer>
  );
}

function CreateAIPlugins(props: CreateAIPluginsProps) {
  const isAirgappedInstance = isAirgapped();

  if (isAirgappedInstance || props.plugins.length === 0) return null;

  return (
    <>
      <StyledDivider />
      <DatasourceSection id="new-ai-query">
        <DatasourceSectionHeading kind="heading-m">
          {createMessage(CREATE_NEW_AI_SECTION_HEADER)}
        </DatasourceSectionHeading>
        <AIDataSources {...props} />
      </DatasourceSection>
    </>
  );
}

const mapStateToProps = (state: AppState) => {
  const searchedPlugin = (
    pluginSearchSelector(state, "search") || ""
  ).toLocaleLowerCase();

  let plugins = getPlugins(state);

  // AI Plugins
  plugins = plugins
    .sort((a, b) => {
      // Sort the AI plugins alphabetically
      return a.name.localeCompare(b.name);
    })
    .filter(
      (plugin) =>
        plugin.type === PluginType.AI &&
        plugin.name.toLocaleLowerCase().includes(searchedPlugin),
    );

  return {
    plugins,
  };
};

const mapDispatchToProps = {
  createTempDatasourceFromForm,
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateAIPlugins);
