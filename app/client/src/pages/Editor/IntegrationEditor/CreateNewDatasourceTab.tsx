import AddDatasourceSecurely from "./AddDatasourceSecurely";
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { thinScrollbar } from "constants/DefaultTheme";
import type { AppState } from "ee/reducers";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
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
import scrollIntoView from "scroll-into-view-if-needed";
import { Text } from "@appsmith/ads";
import MockDataSources from "./MockDataSources";
import NewApiScreen from "./NewApi";
import NewQueryScreen from "./NewQuery";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import {
  createMessage,
  CREATE_NEW_DATASOURCE_DATABASE_HEADER,
  CREATE_NEW_DATASOURCE_MOST_POPULAR_HEADER,
  SAMPLE_DATASOURCES,
} from "ee/constants/messages";
import { Divider } from "@appsmith/ads";
import {
  getApplicationByIdFromWorkspaces,
  getCurrentApplicationIdForCreateNewApp,
} from "ee/selectors/applicationSelectors";
import { useEditorType } from "ee/hooks";
import { useParentEntityInfo } from "ee/hooks/datasourceEditorHooks";
import AIDataSources from "./AIDataSources";
import Debugger from "../DataSourceEditor/Debugger";
import { isPluginActionCreating } from "PluginActionEditor/store";

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
  isCreating,
  isOnboardingScreen,
  pageId,
  showUnsupportedPluginDialog, // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        isCreating={isCreating}
        isOnboardingScreen={isOnboardingScreen}
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
  isCreating,
  isOnboardingScreen,
  pageId,
  showMostPopularPlugins,
  showUnsupportedPluginDialog, // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  const editorType = useEditorType(location.pathname);
  const { editorId, parentEntityId, parentEntityType } =
    useParentEntityInfo(editorType);
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

  const isAirgappedInstance = isAirgapped();

  return (
    <div id="new-datasources" ref={newDatasourceRef}>
      <Text kind="heading-m">
        {showMostPopularPlugins
          ? createMessage(CREATE_NEW_DATASOURCE_MOST_POPULAR_HEADER)
          : createMessage(CREATE_NEW_DATASOURCE_DATABASE_HEADER)}
      </Text>
      <NewQueryScreen
        editorId={editorId}
        editorType={editorType}
        isAirgappedInstance={isAirgappedInstance}
        isCreating={isCreating}
        location={location}
        parentEntityId={parentEntityId || (isOnboardingScreen && pageId) || ""}
        parentEntityType={parentEntityType}
        showMostPopularPlugins={showMostPopularPlugins}
        showUnsupportedPluginDialog={showUnsupportedPluginDialog}
      />
    </div>
  );
}

function CreateNewSaasIntegration({
  active,
  isCreating,
  pageId,
  showUnsupportedPluginDialog, // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <>
      <StyledDivider />
      <div id="new-saas-api" ref={newSaasAPIRef}>
        <Text kind="heading-m">SaaS integrations</Text>
        <NewApiScreen
          isCreating={isCreating}
          location={location}
          pageId={pageId}
          showSaasAPIs
          showUnsupportedPluginDialog={showUnsupportedPluginDialog}
        />
      </div>
    </>
  ) : null;
}

function CreateNewAIIntegration({
  isCreating,
  pageId,
  showUnsupportedPluginDialog, // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  const isAirgappedInstance = isAirgapped();

  return !isAirgappedInstance ? (
    <>
      <StyledDivider />
      <div id="new-ai-query">
        <Text kind="heading-m">AI integrations</Text>
        <AIDataSources
          isCreating={isCreating}
          location={location}
          pageId={pageId}
          showSaasAPIs
          showUnsupportedPluginDialog={showUnsupportedPluginDialog}
        />
      </div>
    </>
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
  isOnboardingScreen?: boolean;
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
      pageId,
      showDebugger,
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
      <>
        <NewIntegrationsContainer className="p-4" id="new-integrations-wrapper">
          {dataSources.length === 0 && <AddDatasourceSecurely />}
          {dataSources.length === 0 &&
            this.props.mockDatasources.length > 0 && (
              <>
                {mockDataSection}
                <StyledDivider />
              </>
            )}
          <CreateNewDatasource
            active={false}
            isCreating={isCreating}
            isOnboardingScreen={!!isOnboardingScreen}
            location={location}
            pageId={pageId}
            showMostPopularPlugins
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          <StyledDivider />
          <CreateNewAPI
            active={false}
            isCreating={isCreating}
            isOnboardingScreen={!!isOnboardingScreen}
            location={location}
            pageId={pageId}
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          <StyledDivider />
          <CreateNewDatasource
            active={false}
            isCreating={isCreating}
            location={location}
            pageId={pageId}
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          <CreateNewSaasIntegration
            active={false}
            isCreating={isCreating}
            location={location}
            pageId={pageId}
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          <CreateNewAIIntegration
            isCreating={isCreating}
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
        {showDebugger && <Debugger />}
      </>
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

  return {
    dataSources: getDatasources(state),
    mockDatasources: getMockDatasources(state),
    isCreating: isPluginActionCreating(state),
    applicationId: getCurrentApplicationId(state),
    canCreateDatasource,
    showDebugger,
    pageId,
  };
};

export default connect(mapStateToProps)(CreateNewDatasourceTab);
