import React from "react";
import type { Datasource } from "entities/Datasource";
import styled from "styled-components";
import type { DefaultRootState } from "react-redux";
import { connect } from "react-redux";
import { getPlugin } from "ee/selectors/entitiesSelector";
import { DB_NOT_SUPPORTED } from "ee/utils/Environments";
import type { PluginType } from "entities/Plugin";
import { getDefaultEnvId } from "ee/api/ApiUtils";
import { EnvConfigSection } from "ee/components/EnvConfigSection";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { isMultipleEnvEnabled } from "ee/utils/planHelpers";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import type { FeatureFlags } from "ee/entities/FeatureFlag";
import DatasourceFormRenderer from "./DatasourceFormRenderer";

export const ViewModeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--ads-v2-spaces-7) 0;
  gap: var(--ads-v2-spaces-4);
  overflow: auto;
  height: 100%;
  width: 100%;
  flex-shrink: 0;
`;

interface RenderDatasourceSectionProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  datasource: Datasource;
  viewMode?: boolean;
  showOnlyCurrentEnv?: boolean;
  currentEnv: string;
  isEnvEnabled: boolean;
  featureFlags?: FeatureFlags;
}

class RenderDatasourceInformation extends React.Component<RenderDatasourceSectionProps> {
  render() {
    const {
      config,
      currentEnv,
      datasource,
      featureFlags,
      isEnvEnabled,
      showOnlyCurrentEnv,
      viewMode,
    } = this.props;
    const { datasourceStorages } = datasource;

    if (showOnlyCurrentEnv || !isEnvEnabled) {
      // in this case, we will show the env that is present in datasourceStorages

      if (!datasourceStorages) {
        return null;
      }

      return (
        <DatasourceFormRenderer
          currentEnvironment={currentEnv}
          datasource={datasource}
          featureFlags={featureFlags}
          section={config}
          viewMode={viewMode}
        />
      );
    }

    return (
      <EnvConfigSection
        config={config}
        currentEnv={currentEnv}
        datasource={datasource}
        viewMode={viewMode}
      />
    );
  }
}
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: DefaultRootState, ownProps: any) => {
  const { datasource } = ownProps;
  const pluginId = datasource.pluginId;
  const plugin = getPlugin(state, pluginId);
  const pluginType = plugin?.type;
  const isEnvEnabled = DB_NOT_SUPPORTED.includes(pluginType as PluginType)
    ? false
    : isMultipleEnvEnabled(selectFeatureFlags(state));
  const currentEnvironmentId = getCurrentEnvironmentId(state);
  const featureFlags = selectFeatureFlags(state);

  return {
    currentEnv: isEnvEnabled ? currentEnvironmentId : getDefaultEnvId(),
    isEnvEnabled,
    featureFlags,
  };
};

export default connect(mapStateToProps)(RenderDatasourceInformation);
