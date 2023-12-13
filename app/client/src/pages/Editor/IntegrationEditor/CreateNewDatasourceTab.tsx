import AddDatasourceSecurely from "./AddDatasourceSecurely";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { thinScrollbar } from "constants/DefaultTheme";
import type { AppState } from "@appsmith/reducers";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { isGACEnabled } from "@appsmith/utils/planHelpers";
import { getHasCreateDatasourcePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import {
  getDatasources,
  getMockDatasources,
} from "@appsmith/selectors/entitiesSelector";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { connect } from "react-redux";
import type { Datasource, MockDatasource } from "entities/Datasource";
import scrollIntoView from "scroll-into-view-if-needed";
import { Text } from "design-system";
import MockDataSources from "./MockDataSources";
import NewApiScreen from "./NewApi";
import NewQueryScreen from "./NewQuery";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import history from "utils/history";
import { showDebuggerFlag } from "../../../selectors/debuggerSelectors";
import classNames from "classnames";
import { getIsAppSidebarEnabled } from "../../../selectors/ideSelectors";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  createMessage,
  CREATE_NEW_DATASOURCE_DATABASE_HEADER,
  CREATE_NEW_DATASOURCE_MOST_POPULAR_HEADER,
  SAMPLE_DATASOURCES,
} from "@appsmith/constants/messages";
import { Divider } from "design-system";
import {
  getApplicationByIdFromWorkspaces,
  getCurrentApplicationIdForCreateNewApp,
} from "@appsmith/selectors/applicationSelectors";

const NewIntegrationsContainer = styled.div`
  ${thinScrollbar};
  overflow: auto;
  flex: 1;
  & > div {
    margin-bottom: var(--ads-spaces-9);
  }
`;

const StyledDivider = styled(Divider)`
  margin-bottom: var(--ads-spaces-9);
`;

interface MockDataSourcesProps {
  mockDatasources: MockDatasource[];
  active: boolean;
}

function UseMockDatasources({ active, mockDatasources }: MockDataSourcesProps) {
  const useMockRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);
  useEffect(() => {
    if (active && useMockRef.current) {
      isMounted.current &&
        scrollIntoView(useMockRef.current, {
          behavior: "smooth",
          scrollMode: "always",
          block: "start",
          boundary: document.getElementById("new-integrations-wrapper"),
        });
    } else {
      isMounted.current = true;
    }
  }, [active]);
  return (
    <div id="mock-database" ref={useMockRef}>
      <Text kind="heading-m">{createMessage(SAMPLE_DATASOURCES)}</Text>
      <MockDataSources mockDatasources={mockDatasources} />
    </div>
  );
}

function CreateNewAPI({
  active,
  history,
  isCreating,
  pageId,
  showUnsupportedPluginDialog,
}: any) {
  const newAPIRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (active && newAPIRef.current) {
      isMounted.current &&
        scrollIntoView(newAPIRef.current, {
          behavior: "smooth",
          scrollMode: "always",
          block: "start",
          boundary: document.getElementById("new-integrations-wrapper"),
        });
    } else {
      isMounted.current = true;
    }
  }, [active]);
  return (
    <div id="new-api" ref={newAPIRef}>
      <Text kind="heading-m">APIs</Text>
      <NewApiScreen
        history={history}
        isCreating={isCreating}
        location={location}
        pageId={pageId}
        showSaasAPIs={false}
        showUnsupportedPluginDialog={showUnsupportedPluginDialog}
      />
    </div>
  );
}

function CreateNewDatasource({
  active,
  history,
  isCreating,
  pageId,
  showMostPopularPlugins,
  showUnsupportedPluginDialog,
}: any) {
  const newDatasourceRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && newDatasourceRef.current) {
      scrollIntoView(newDatasourceRef.current, {
        behavior: "smooth",
        scrollMode: "always",
        block: "start",
        boundary: document.getElementById("new-integrations-wrapper"),
      });
    }
  }, [active]);

  return (
    <div id="new-datasources" ref={newDatasourceRef}>
      <Text kind="heading-m">
        {showMostPopularPlugins
          ? createMessage(CREATE_NEW_DATASOURCE_MOST_POPULAR_HEADER)
          : createMessage(CREATE_NEW_DATASOURCE_DATABASE_HEADER)}
      </Text>
      <NewQueryScreen
        history={history}
        isCreating={isCreating}
        location={location}
        pageId={pageId}
        showMostPopularPlugins={showMostPopularPlugins}
        showUnsupportedPluginDialog={showUnsupportedPluginDialog}
      />
    </div>
  );
}

function CreateNewSaasIntegration({
  active,
  history,
  isCreating,
  pageId,
  showUnsupportedPluginDialog,
}: any) {
  const newSaasAPIRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);
  const isAirgappedInstance = isAirgapped();

  useEffect(() => {
    if (active && newSaasAPIRef.current) {
      isMounted.current &&
        scrollIntoView(newSaasAPIRef.current, {
          behavior: "smooth",
          scrollMode: "always",
          block: "start",
          boundary: document.getElementById("new-integrations-wrapper"),
        });
    } else {
      isMounted.current = true;
    }
  }, [active]);
  return !isAirgappedInstance ? (
    <div id="new-saas-api" ref={newSaasAPIRef}>
      <Text kind="heading-m">SaaS Integrations</Text>
      <NewApiScreen
        history={history}
        isCreating={isCreating}
        location={location}
        pageId={pageId}
        showSaasAPIs
        showUnsupportedPluginDialog={showUnsupportedPluginDialog}
      />
    </div>
  ) : null;
}

interface CreateNewDatasourceScreenProps {
  isCreating: boolean;
  dataSources: Datasource[];
  mockDatasources: MockDatasource[];
  applicationId: string;
  canCreateDatasource?: boolean;
  showDebugger: boolean;
  pageId: string;
  isAppSidebarEnabled: boolean;
  isEnabledForCreateNew: boolean;
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
      isAppSidebarEnabled,
      isCreating,
      isEnabledForCreateNew,
      pageId,
    } = this.props;
    if (!canCreateDatasource) return null;
    const mockDataSection =
      this.props.mockDatasources.length > 0 ? (
        <UseMockDatasources
          active={false}
          mockDatasources={this.props.mockDatasources}
        />
      ) : null;
    return (
      <NewIntegrationsContainer
        className={classNames({
          "p-4": isAppSidebarEnabled,
        })}
        id="new-integrations-wrapper"
      >
        {dataSources.length === 0 && <AddDatasourceSecurely />}
        {dataSources.length === 0 && this.props.mockDatasources.length > 0 && (
          <>
            {mockDataSection}
            <StyledDivider />
          </>
        )}
        {isEnabledForCreateNew && (
          <>
            <CreateNewDatasource
              active={false}
              history={history}
              isCreating={isCreating}
              location={location}
              pageId={pageId}
              showMostPopularPlugins
              showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
            />
            <StyledDivider />
          </>
        )}
        <CreateNewAPI
          active={false}
          history={history}
          isCreating={isCreating}
          location={location}
          pageId={pageId}
          showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
        />
        <StyledDivider />
        <CreateNewDatasource
          active={false}
          history={history}
          isCreating={isCreating}
          location={location}
          pageId={pageId}
          showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
        />
        <StyledDivider />
        <CreateNewSaasIntegration
          active={false}
          history={history}
          isCreating={isCreating}
          location={location}
          pageId={pageId}
          showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
        />
        {dataSources.length > 0 && this.props.mockDatasources.length > 0 && (
          <>
            <StyledDivider />
            {mockDataSection}
          </>
        )}
      </NewIntegrationsContainer>
    );
  }
}

const mapStateToProps = (state: AppState) => {
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

  const isEnabledForCreateNew =
    !!featureFlags[FEATURE_FLAG.ab_create_new_apps_enabled];
  const isAppSidebarEnabled = getIsAppSidebarEnabled(state);
  return {
    dataSources: getDatasources(state),
    mockDatasources: getMockDatasources(state),
    isCreating: state.ui.apiPane.isCreating,
    applicationId: getCurrentApplicationId(state),
    canCreateDatasource,
    showDebugger,
    pageId,
    isAppSidebarEnabled,
    isEnabledForCreateNew,
  };
};

export default connect(mapStateToProps)(CreateNewDatasourceTab);
