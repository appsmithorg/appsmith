import React from "react";
import { connect, useSelector, useDispatch } from "react-redux";
import {
  createDatasourceFromForm,
  createTempDatasourceFromForm,
} from "actions/datasourceActions";
import type { DefaultRootState } from "react-redux";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { type Plugin, PluginPackageName, PluginType } from "entities/Plugin";
import { getAssetUrl, isAirgapped } from "ee/utils/airgapHelpers";
import type { Datasource } from "entities/Datasource";
import { getIsAnvilEnabledInCurrentApplication } from "layoutSystems/anvil/integrations/selectors";
import { getInitialDatasourcePayload } from "sagas/helper";
import { getDatasourcesLoadingState } from "selectors/datasourceSelectors";
import {
  DatasourceContainer,
  DatasourceSection,
  DatasourceSectionHeading,
  StyledDivider,
} from "./IntegrationStyledComponents";
import DatasourceItem from "./DatasourceItem";
import {
  AI_DATASOURCE,
  CREATE_NEW_AI_SECTION_HEADER,
  createMessage,
} from "ee/constants/messages";
import { pluginSearchSelector } from "./CreateNewDatasourceHeader";
import { getDatasources, getPlugins } from "ee/selectors/entitiesSelector";
import { filterSearch } from "./util";
import { Spinner } from "@appsmith/ads";

interface CreateAIPluginsProps {
  pageId: string;
  isCreating?: boolean;
  showUnsupportedPluginDialog: (callback: () => void) => void;

  plugins: Plugin[];
  createTempDatasourceFromForm: typeof createTempDatasourceFromForm;
}

function AIDataSources(props: CreateAIPluginsProps) {
  const { isCreating, plugins } = props;
  const [creatingId, setCreatingId] = React.useState<string | null>(null);
  const dispatch = useDispatch();
  const isAnvilEnabled = useSelector(getIsAnvilEnabledInCurrentApplication);
  const dsList: Datasource[] = useSelector(getDatasources);

  const handleOnClick = (plugin: Plugin) => {
    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      pluginName: plugin.name,
      pluginPackageName: plugin.packageName,
    });

    if (
      isAnvilEnabled &&
      plugin.packageName === PluginPackageName.APPSMITH_AGENT
    ) {
      if (isCreating) return;

      setCreatingId(plugin.id);

      const datasourceInitialPayload = getInitialDatasourcePayload(
        plugin.id,
        dsList,
        plugin.type,
        createMessage(AI_DATASOURCE),
      );

      dispatch(createDatasourceFromForm(datasourceInitialPayload));
    } else {
      props.createTempDatasourceFromForm({
        pluginId: plugin.id,
        type: plugin.type,
      });
    }
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
          rightSibling={
            isCreating &&
            creatingId === plugin.id && <Spinner className="cta" size={"sm"} />
          }
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

const mapStateToProps = (
  state: DefaultRootState,
  props: {
    isCreating?: boolean;
  },
) => {
  const searchedPlugin = (
    pluginSearchSelector(state, "search") || ""
  ).toLocaleLowerCase();

  let plugins = getPlugins(state);

  // AI Plugins
  plugins = filterSearch(
    plugins
      .sort((a, b) => {
        // Sort the AI plugins alphabetically
        return a.name.localeCompare(b.name);
      })
      .filter((plugin) => plugin.type === PluginType.AI),
    searchedPlugin,
  ) as Plugin[];

  return {
    plugins,
    isCreating: props.isCreating || getDatasourcesLoadingState(state),
  };
};

const mapDispatchToProps = {
  createTempDatasourceFromForm,
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateAIPlugins);
