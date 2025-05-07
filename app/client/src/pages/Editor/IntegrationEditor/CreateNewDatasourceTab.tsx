import AddDatasourceSecurely from "./AddDatasourceSecurely";
import React from "react";
import styled from "styled-components";
import { thinScrollbar } from "constants/DefaultTheme";
import type { DefaultRootState } from "react-redux";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import {
  selectFeatureFlagCheck,
  selectFeatureFlags,
} from "ee/selectors/featureFlagsSelectors";
import { isGACEnabled } from "ee/utils/planHelpers";
import { getHasCreateDatasourcePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import {
  getDatasources,
  getMockDatasources,
} from "ee/selectors/entitiesSelector";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { connect } from "react-redux";
import type { Datasource, MockDatasource } from "entities/Datasource";
import MockDataSources from "./MockDataSources";
import APIOrSaasPlugins from "./APIOrSaasPlugins";
import DBPluginsOrMostPopular from "./DBOrMostPopularPlugins";
import AIPlugins from "./AIPlugins";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import {
  getApplicationByIdFromWorkspaces,
  getCurrentApplicationIdForCreateNewApp,
} from "ee/selectors/applicationSelectors";
import Debugger from "../DataSourceEditor/Debugger";
import { isPluginActionCreating } from "PluginActionEditor/store";
import RequestNewIntegration from "./RequestNewIntegration";
import { StyledDivider } from "./IntegrationStyledComponents";
import CreateNewDatasourceHeader from "./CreateNewDatasourceHeader";
import EmptySearchedPlugins from "./EmptySearchedPlugins";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
// This css file contains for the EXTERNAL_SAAS plugin modal
import "./index.css";

const NewIntegrationsContainer = styled.div<{ isOnboardingScreen?: boolean }>`
  ${thinScrollbar};
  overflow: auto;
  flex: 1;
  ${(props) =>
    props.isOnboardingScreen
      ? "padding: var(--ads-v2-spaces-5) var(--ads-spaces-11);"
      : "padding: var(--ads-spaces-8);"}
  & > div {
    margin-bottom: var(--ads-spaces-7);
  }
`;

interface CreateNewDatasourceScreenProps {
  isCreating: boolean;
  dataSources: Datasource[];
  mockDatasources: MockDatasource[];
  applicationId: string;
  canCreateDatasource?: boolean;
  showDebugger: boolean;
  pageId: string;
  isOnboardingScreen?: boolean;
  isRequestNewIntegrationEnabled: boolean;
  isPremiumDatasourcesViewEnabled: boolean;
}

interface CreateNewDatasourceScreenState {
  unsupportedPluginDialogVisible: boolean;
}

class CreateNewDatasourceTab extends React.Component<
  CreateNewDatasourceScreenProps,
  CreateNewDatasourceScreenState
> {
  unsupportedPluginContinueAction: () => void;
  constructor(props: CreateNewDatasourceScreenProps) {
    super(props);
    this.unsupportedPluginContinueAction = () => null;
    this.state = {
      unsupportedPluginDialogVisible: false,
    };
  }

  showUnsupportedPluginDialog = (callback: () => void) => {
    this.setState({
      unsupportedPluginDialogVisible: true,
    });
    this.unsupportedPluginContinueAction = callback;
  };
  render() {
    const {
      canCreateDatasource = false,
      dataSources,
      isCreating,
      isOnboardingScreen,
      isPremiumDatasourcesViewEnabled,
      isRequestNewIntegrationEnabled,
      pageId,
      showDebugger,
    } = this.props;

    if (!canCreateDatasource) return null;

    const mockDataSectionVisible = this.props.mockDatasources.length > 0;

    return (
      <>
        <NewIntegrationsContainer
          id="new-integrations-wrapper"
          isOnboardingScreen={!!isOnboardingScreen}
        >
          <CreateNewDatasourceHeader />
          <StyledDivider />
          {dataSources.length === 0 && <AddDatasourceSecurely />}
          {dataSources.length === 0 && mockDataSectionVisible && (
            <MockDataSources
              mockDatasources={this.props.mockDatasources}
              postDivider
            />
          )}
          <DBPluginsOrMostPopular
            active={false}
            isCreating={isCreating}
            isOnboardingScreen={!!isOnboardingScreen}
            location={location}
            pageId={pageId}
            showMostPopularPlugins
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          <APIOrSaasPlugins
            active={false}
            isCreating={isCreating}
            isOnboardingScreen={!!isOnboardingScreen}
            isPremiumDatasourcesViewEnabled={isPremiumDatasourcesViewEnabled}
            location={location}
            pageId={pageId}
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          <DBPluginsOrMostPopular
            active={false}
            addDivider
            isCreating={isCreating}
            location={location}
            pageId={pageId}
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          <APIOrSaasPlugins
            active={false}
            isCreating={isCreating}
            isPremiumDatasourcesViewEnabled={isPremiumDatasourcesViewEnabled}
            location={location}
            pageId={pageId}
            showSaasAPIs
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          <AIPlugins
            isCreating={isCreating}
            pageId={pageId}
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          {dataSources.length > 0 && mockDataSectionVisible && (
            <MockDataSources
              mockDatasources={this.props.mockDatasources}
              preDivider
            />
          )}
          <EmptySearchedPlugins
            isPremiumDatasourcesViewEnabled={
              this.props.isPremiumDatasourcesViewEnabled
            }
            mockDatasources={this.props.mockDatasources}
          />
        </NewIntegrationsContainer>
        {isRequestNewIntegrationEnabled && <RequestNewIntegration />}
        {showDebugger && <Debugger />}
      </>
    );
  }
}

const mapStateToProps = (state: DefaultRootState) => {
  const onboardingAppId = getCurrentApplicationIdForCreateNewApp(state);
  const onboardingApplication = getApplicationByIdFromWorkspaces(
    state,
    onboardingAppId || "",
  );
  const pageId = !!onboardingAppId
    ? onboardingApplication?.defaultPageId || ""
    : getCurrentPageId(state);

  const showDebugger = showDebuggerFlag(state);
  const userWorkspacePermissions =
    getCurrentAppWorkspace(state).userPermissions ?? [];

  const featureFlags = selectFeatureFlags(state);
  const isFeatureEnabled = isGACEnabled(featureFlags);

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );

  const isRequestNewIntegrationEnabled = selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.ab_request_new_integration_enabled,
  );

  const isPremiumDatasourcesViewEnabled = selectFeatureFlagCheck(
    state,
    FEATURE_FLAG.ab_premium_datasources_view_enabled,
  );

  return {
    dataSources: getDatasources(state),
    mockDatasources: getMockDatasources(state),
    isCreating: isPluginActionCreating(state),
    applicationId: getCurrentApplicationId(state),
    canCreateDatasource,
    showDebugger,
    pageId,
    isRequestNewIntegrationEnabled,
    isPremiumDatasourcesViewEnabled,
  };
};

export default connect(mapStateToProps)(CreateNewDatasourceTab);
