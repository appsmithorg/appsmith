import React from "react";
import { connect } from "react-redux";
import type { InjectedFormProps } from "redux-form";
import { reduxForm } from "redux-form";
import styled from "styled-components";
import type { AppState } from "@appsmith/reducers";
import { API_HOME_SCREEN_FORM } from "@appsmith/constants/forms";
import ActiveDataSources from "./ActiveDataSources";
import {
  getDatasources,
  getMockDatasources,
} from "@appsmith/selectors/entitiesSelector";
import type { Datasource, MockDatasource } from "entities/Datasource";
import type { TabProp } from "design-system-old";
import { IconSize } from "design-system-old";
import { INTEGRATION_TABS, INTEGRATION_EDITOR_MODES } from "constants/routes";
import BackButton from "../DataSourceEditor/BackButton";
import UnsupportedPluginDialog from "./UnsupportedPluginDialog";
import { getQueryParams } from "utils/URLUtils";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";

import { Tab, TabPanel, Tabs, TabsList } from "design-system";
import Debugger, {
  ResizerContentContainer,
  ResizerMainContainer,
} from "../DataSourceEditor/Debugger";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { isGACEnabled } from "@appsmith/utils/planHelpers";
import { getHasCreateDatasourcePermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import CreateNewDatasourceTab from "./CreateNewDatasourceTab";

const HeaderFlex = styled.div`
  font-size: 20px;
  display: flex;
  align-items: center;
  color: var(--ads-v2-color-fg-emphasis-plus);
  padding: 0 var(--ads-v2-spaces-7);
`;

const ApiHomePage = styled.div`
  display: flex;
  flex-direction: column;

  padding-top: 20px;
  /* margin-left: 10px; */
  flex: 1;
  overflow: hidden !important;
  .closeBtn {
    position: absolute;
    left: 70%;
  }
  .fontSize16 {
    font-size: 16px;
  }
  .integrations-content-container {
    padding: 0 var(--ads-v2-spaces-7);
  }
  .t--vertical-menu {
    overflow: auto;
  }
`;

const MainTabsContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 0 var(--ads-v2-spaces-7);
  /* .react-tabs__tab-list {
    margin: 2px;
  } */
`;

const SectionGrid = styled.div<{ isActiveTab?: boolean }>`
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px 16px;
  flex: 1;
  min-height: 100%;
`;

interface IntegrationsHomeScreenProps {
  pageId: string;
  selectedTab: string;
  location: {
    search: string;
    pathname: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  isCreating: boolean;
  dataSources: Datasource[];
  mockDatasources: MockDatasource[];
  applicationId: string;
  canCreateDatasource?: boolean;
  showDebugger: boolean;
}

interface IntegrationsHomeScreenState {
  page: number;
  activePrimaryMenuId: string;
  activeSecondaryMenuId: number;
  unsupportedPluginDialogVisible: boolean;
}

type Props = IntegrationsHomeScreenProps &
  InjectedFormProps<{ category: string }, IntegrationsHomeScreenProps>;

const PRIMARY_MENU_IDS = {
  ACTIVE: "ACTIVE",
  CREATE_NEW: "CREATE_NEW",
};

const getSecondaryMenuIds = (hasActiveSources = false) => {
  return {
    API: 0 + (hasActiveSources ? 0 : 1),
    DATABASE: 1 + (hasActiveSources ? 0 : 1),
    MOCK_DATABASE: 2 - (hasActiveSources ? 0 : 2),
  };
};

const TERTIARY_MENU_IDS = {
  ACTIVE_CONNECTIONS: 0,
  MOCK_DATABASE: 1,
};

class IntegrationsHomeScreen extends React.Component<
  Props,
  IntegrationsHomeScreenState
> {
  unsupportedPluginContinueAction: () => void;

  constructor(props: Props) {
    super(props);
    this.unsupportedPluginContinueAction = () => null;
    this.state = {
      page: 1,
      activePrimaryMenuId: PRIMARY_MENU_IDS.CREATE_NEW,
      activeSecondaryMenuId: getSecondaryMenuIds(
        props.mockDatasources.length > 0,
      ).API,
      unsupportedPluginDialogVisible: false,
    };
  }

  syncActivePrimaryMenu = () => {
    // on mount/update if syncing the primary active menu.
    const { selectedTab } = this.props;
    if (
      (selectedTab === INTEGRATION_TABS.NEW &&
        this.state.activePrimaryMenuId !== PRIMARY_MENU_IDS.CREATE_NEW) ||
      (selectedTab === INTEGRATION_TABS.ACTIVE &&
        this.state.activePrimaryMenuId !== PRIMARY_MENU_IDS.ACTIVE)
    ) {
      this.setState({
        activePrimaryMenuId:
          selectedTab === INTEGRATION_TABS.NEW
            ? PRIMARY_MENU_IDS.CREATE_NEW
            : PRIMARY_MENU_IDS.ACTIVE,
      });
    }
  };

  componentDidMount() {
    const { dataSources, history, pageId } = this.props;

    const queryParams = getQueryParams();
    const redirectMode = queryParams.mode;
    const isGeneratePageInitiator = getIsGeneratePageInitiator();
    if (isGeneratePageInitiator) {
      if (redirectMode === INTEGRATION_EDITOR_MODES.AUTO) {
        delete queryParams.mode;
        delete queryParams.from;
        history.replace(
          integrationEditorURL({
            pageId,
            selectedTab: INTEGRATION_TABS.NEW,
            params: queryParams,
          }),
        );
      }
    } else if (
      dataSources.length > 0 &&
      redirectMode === INTEGRATION_EDITOR_MODES.AUTO
    ) {
      // User will be taken to active tab if there are datasources
      history.replace(
        integrationEditorURL({
          pageId,
          selectedTab: INTEGRATION_TABS.ACTIVE,
        }),
      );
    } else if (redirectMode === INTEGRATION_EDITOR_MODES.MOCK) {
      // If there are no datasources -> new user
      history.replace(
        integrationEditorURL({
          pageId,
          selectedTab: INTEGRATION_TABS.NEW,
        }),
      );
      this.onSelectSecondaryMenu(
        getSecondaryMenuIds(dataSources.length > 0).MOCK_DATABASE,
      );
    } else {
      this.syncActivePrimaryMenu();
    }
  }

  componentDidUpdate(prevProps: Props) {
    this.syncActivePrimaryMenu();
    const { dataSources, history, pageId } = this.props;
    if (dataSources.length === 0 && prevProps.dataSources.length > 0) {
      history.replace(
        integrationEditorURL({
          pageId,
          selectedTab: INTEGRATION_TABS.NEW,
        }),
      );
      this.onSelectSecondaryMenu(
        getSecondaryMenuIds(dataSources.length > 0).MOCK_DATABASE,
      );
    }
  }

  onSelectPrimaryMenu = (activePrimaryMenuId: string) => {
    const { dataSources, history, pageId } = this.props;
    if (activePrimaryMenuId === this.state.activePrimaryMenuId) {
      return;
    }
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab:
          activePrimaryMenuId === PRIMARY_MENU_IDS.ACTIVE
            ? INTEGRATION_TABS.ACTIVE
            : INTEGRATION_TABS.NEW,
      }),
    );
    this.setState({
      activeSecondaryMenuId:
        activePrimaryMenuId === PRIMARY_MENU_IDS.ACTIVE
          ? TERTIARY_MENU_IDS.ACTIVE_CONNECTIONS
          : getSecondaryMenuIds(dataSources.length > 0).API,
    });
  };

  onSelectSecondaryMenu = (activeSecondaryMenuId: number) => {
    this.setState({ activeSecondaryMenuId });
  };

  render() {
    const {
      canCreateDatasource = false,
      dataSources,
      location,
      pageId,
      showDebugger,
    } = this.props;
    const { unsupportedPluginDialogVisible } = this.state;
    let currentScreen;
    const { activePrimaryMenuId } = this.state;

    const PRIMARY_MENU: TabProp[] = [
      {
        key: "ACTIVE",
        title: "Active",
        panelComponent: <div />,
      },
      ...(canCreateDatasource
        ? [
            {
              key: "CREATE_NEW",
              title: "Create new",
              panelComponent: <div />,
              icon: "plus",
              iconSize: IconSize.XS,
            },
          ]
        : []),
    ].filter(Boolean);

    const isGeneratePageInitiator = getIsGeneratePageInitiator();
    // Avoid user to switch tabs when in generate page flow by hiding the tabs itself.
    const showTabs = !isGeneratePageInitiator;

    if (activePrimaryMenuId === PRIMARY_MENU_IDS.CREATE_NEW) {
      currentScreen = <CreateNewDatasourceTab />;
    } else {
      currentScreen = (
        <ActiveDataSources
          dataSources={dataSources}
          history={this.props.history}
          location={location}
          onCreateNew={() => {
            this.onSelectPrimaryMenu(PRIMARY_MENU_IDS.CREATE_NEW);
            // Event for datasource creation click
            const entryPoint = DatasourceCreateEntryPoints.ACTIVE_DATASOURCE;
            AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
              entryPoint,
            });
          }}
          pageId={pageId}
        />
      );
    }
    return (
      <>
        <BackButton />
        <UnsupportedPluginDialog
          isModalOpen={unsupportedPluginDialogVisible}
          onClose={() =>
            this.setState({ unsupportedPluginDialogVisible: false })
          }
          onContinue={this.unsupportedPluginContinueAction}
        />
        <ApiHomePage
          className="t--integrationsHomePage"
          style={{ overflow: "auto" }}
        >
          <HeaderFlex>
            <p className="sectionHeadings">Datasources in your workspace</p>
          </HeaderFlex>
          <SectionGrid
            isActiveTab={
              this.state.activePrimaryMenuId !== PRIMARY_MENU_IDS.ACTIVE
            }
          >
            <MainTabsContainer>
              {showTabs && (
                <Tabs
                  data-testid="t--datasource-tab"
                  onValueChange={this.onSelectPrimaryMenu}
                  value={this.state.activePrimaryMenuId}
                >
                  <TabsList>
                    {PRIMARY_MENU.map((tab: TabProp) => (
                      <Tab
                        data-testid={`t--tab-${tab.key}`}
                        key={tab.key}
                        value={tab.key}
                      >
                        {tab.title}
                      </Tab>
                    ))}
                  </TabsList>
                  {PRIMARY_MENU.map((tab: TabProp) => (
                    <TabPanel key={tab.key} value={tab.key}>
                      {tab.panelComponent}
                    </TabPanel>
                  ))}
                </Tabs>
              )}
            </MainTabsContainer>
            <ResizerMainContainer>
              <ResizerContentContainer className="integrations-content-container">
                {currentScreen}
              </ResizerContentContainer>
              {showDebugger && <Debugger />}
            </ResizerMainContainer>
          </SectionGrid>
        </ApiHomePage>
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  // Debugger render flag
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
    isCreating: state.ui.apiPane.isCreating,
    applicationId: getCurrentApplicationId(state),
    canCreateDatasource,
    showDebugger,
  };
};

export default connect(mapStateToProps)(
  reduxForm<{ category: string }, IntegrationsHomeScreenProps>({
    form: API_HOME_SCREEN_FORM,
  })(IntegrationsHomeScreen),
);
