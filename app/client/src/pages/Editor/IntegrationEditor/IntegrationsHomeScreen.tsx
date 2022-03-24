import React, { useEffect, useRef } from "react";
import { connect } from "react-redux";
import { reduxForm, InjectedFormProps } from "redux-form";
import styled from "styled-components";
import { AppState } from "reducers";
import { API_HOME_SCREEN_FORM } from "constants/forms";
import { Colors } from "constants/Colors";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { IconSize } from "components/ads/Icon";
import NewApiScreen from "./NewApi";
import NewQueryScreen from "./NewQuery";
import ActiveDataSources from "./ActiveDataSources";
import MockDataSources from "./MockDataSources";
import AddDatasourceSecurely from "./AddDatasourceSecurely";
import { getDatasources, getMockDatasources } from "selectors/entitiesSelector";
import { Datasource, MockDatasource } from "entities/Datasource";
import Text, { TextType } from "components/ads/Text";
import scrollIntoView from "scroll-into-view-if-needed";
import {
  INTEGRATION_TABS,
  INTEGRATION_EDITOR_URL,
  INTEGRATION_EDITOR_MODES,
} from "constants/routes";
import { thinScrollbar } from "constants/DefaultTheme";
import BackButton from "../DataSourceEditor/BackButton";
import UnsupportedPluginDialog from "./UnsupportedPluginDialog";
import { getQueryParams } from "utils/AppsmithUtils";
import { getIsGeneratePageInitiator } from "utils/GenerateCrudUtil";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const HeaderFlex = styled.div`
  display: flex;
  align-items: center;
`;

const ApiHomePage = styled.div`
  display: flex;
  flex-direction: column;

  font-size: 20px;
  padding: 20px 20px 0 20px;
  /* margin-left: 10px; */
  flex: 1;
  overflow: hidden !important;
  .closeBtn {
    position: absolute;
    left: 70%;
  }
  .bp3-collapse-body {
    position: absolute;
    z-index: 99999;
    background-color: ${Colors.WHITE};
    border: 1px solid ${Colors.ALTO};
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    width: 100%;
    padding: 20px;
  }
  .fontSize16 {
    font-size: 16px;
  }
`;

const MainTabsContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const SectionGrid = styled.div<{ isActiveTab?: boolean }>`
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr ${({ isActiveTab }) => isActiveTab && "180px"};
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px 16px;
  flex: 1;
  min-height: 0;
`;
const NewIntegrationsContainer = styled.div`
  ${thinScrollbar};
  scrollbar-width: thin;
  overflow: auto;
  flex: 1;
  & > div {
    margin-bottom: 20px;
  }
`;

type IntegrationsHomeScreenProps = {
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
};

type IntegrationsHomeScreenState = {
  page: number;
  activePrimaryMenuId: number;
  activeSecondaryMenuId: number;
  unsupportedPluginDialogVisible: boolean;
};

type Props = IntegrationsHomeScreenProps &
  InjectedFormProps<{ category: string }, IntegrationsHomeScreenProps>;

const PRIMARY_MENU: TabProp[] = [
  {
    key: "ACTIVE",
    title: "Active",
    panelComponent: <div />,
  },
  {
    key: "CREATE_NEW",
    title: "Create New",
    panelComponent: <div />,
    icon: "plus",
    iconSize: IconSize.XS,
  },
];

const PRIMARY_MENU_IDS = {
  ACTIVE: 0,
  CREATE_NEW: 1,
};

const SECONDARY_MENU: TabProp[] = [
  {
    key: "API",
    title: "API",
    panelComponent: <div />,
  },
  {
    key: "DATABASE",
    title: "Database",
    panelComponent: <div />,
  },
];

const getSecondaryMenu = (hasActiveSources: boolean) => {
  const mockDbMenu = {
    key: "MOCK_DATABASE",
    title: "Sample Databases",
    panelComponent: <div />,
  };
  return hasActiveSources
    ? [...SECONDARY_MENU, mockDbMenu]
    : [mockDbMenu, ...SECONDARY_MENU];
};

const getSecondaryMenuIds = (hasActiveSources = false) => {
  return {
    API: 0 + (hasActiveSources ? 0 : 1),
    DATABASE: 1 + (hasActiveSources ? 0 : 1),
    MOCK_DATABASE: 2 - (hasActiveSources ? 0 : 2),
  };
};

// const TERTIARY_MENU: TabProp[] = [
//   {
//     key: "ACTIVE_CONNECTIONS",
//     title: "Active Connections",
//     panelComponent: <div />,
//   },
//   {
//     key: "MOCK_DATABASE",
//     title: "Mock Databases",
//     panelComponent: <div />,
//   },
// ];

const TERTIARY_MENU_IDS = {
  ACTIVE_CONNECTIONS: 0,
  MOCK_DATABASE: 1,
};

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
      <Text type={TextType.H2}>Sample Databases</Text>
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
      <Text type={TextType.H2}>APIs</Text>
      <NewApiScreen
        history={history}
        isCreating={isCreating}
        location={location}
        pageId={pageId}
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
      <Text type={TextType.H2}>Databases</Text>
      <NewQueryScreen
        history={history}
        isCreating={isCreating}
        location={location}
        pageId={pageId}
        showUnsupportedPluginDialog={showUnsupportedPluginDialog}
      />
    </div>
  );
}

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
    const { applicationId, dataSources, history, pageId } = this.props;

    const queryParams = getQueryParams();
    const redirectMode = queryParams.mode;
    const isGeneratePageInitiator = getIsGeneratePageInitiator();
    if (isGeneratePageInitiator) {
      if (redirectMode === INTEGRATION_EDITOR_MODES.AUTO) {
        delete queryParams.mode;
        delete queryParams.from;
        history.replace(
          INTEGRATION_EDITOR_URL(
            applicationId,
            pageId,
            INTEGRATION_TABS.NEW,
            "",
            queryParams,
          ),
        );
      }
    } else if (
      dataSources.length > 0 &&
      redirectMode === INTEGRATION_EDITOR_MODES.AUTO
    ) {
      // User will be taken to active tab if there are datasources
      history.replace(
        INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.ACTIVE),
      );
    } else if (redirectMode === INTEGRATION_EDITOR_MODES.MOCK) {
      // If there are no datasources -> new user
      history.replace(
        INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
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
    const { applicationId, dataSources, history, pageId } = this.props;
    if (dataSources.length === 0 && prevProps.dataSources.length > 0) {
      history.replace(
        INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
      );
      this.onSelectSecondaryMenu(
        getSecondaryMenuIds(dataSources.length > 0).MOCK_DATABASE,
      );
    }
  }

  onSelectPrimaryMenu = (activePrimaryMenuId: number) => {
    const { applicationId, dataSources, history, pageId } = this.props;
    if (activePrimaryMenuId === this.state.activePrimaryMenuId) {
      return;
    }
    history.push(
      INTEGRATION_EDITOR_URL(
        applicationId,
        pageId,
        activePrimaryMenuId === PRIMARY_MENU_IDS.ACTIVE
          ? INTEGRATION_TABS.ACTIVE
          : INTEGRATION_TABS.NEW,
      ),
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

  showUnsupportedPluginDialog = (callback: () => void) => {
    this.setState({
      unsupportedPluginDialogVisible: true,
    });
    this.unsupportedPluginContinueAction = callback;
  };

  render() {
    const { dataSources, history, isCreating, location, pageId } = this.props;
    const { unsupportedPluginDialogVisible } = this.state;
    let currentScreen;
    const { activePrimaryMenuId, activeSecondaryMenuId } = this.state;

    const isGeneratePageInitiator = getIsGeneratePageInitiator();
    // Avoid user to switch tabs when in generate page flow by hiding the tabs itself.
    const showTabs = !isGeneratePageInitiator;
    const mockDataSection =
      this.props.mockDatasources.length > 0 ? (
        <UseMockDatasources
          active={
            activeSecondaryMenuId ===
            getSecondaryMenuIds(dataSources.length > 0).MOCK_DATABASE
          }
          mockDatasources={this.props.mockDatasources}
        />
      ) : null;

    if (activePrimaryMenuId === PRIMARY_MENU_IDS.CREATE_NEW) {
      currentScreen = (
        <NewIntegrationsContainer id="new-integrations-wrapper">
          {dataSources.length === 0 && <AddDatasourceSecurely />}
          {dataSources.length === 0 &&
            this.props.mockDatasources.length > 0 &&
            mockDataSection}
          <CreateNewAPI
            active={
              activeSecondaryMenuId ===
              getSecondaryMenuIds(dataSources.length > 0).API
            }
            history={history}
            isCreating={isCreating}
            location={location}
            pageId={pageId}
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          <CreateNewDatasource
            active={
              activeSecondaryMenuId ===
              getSecondaryMenuIds(dataSources.length > 0).DATABASE
            }
            history={history}
            isCreating={isCreating}
            location={location}
            pageId={pageId}
            showUnsupportedPluginDialog={this.showUnsupportedPluginDialog}
          />
          {dataSources.length > 0 &&
            this.props.mockDatasources.length > 0 &&
            mockDataSection}
        </NewIntegrationsContainer>
      );
    } else {
      currentScreen = (
        <ActiveDataSources
          dataSources={dataSources}
          history={this.props.history}
          location={location}
          onCreateNew={() =>
            this.onSelectPrimaryMenu(PRIMARY_MENU_IDS.CREATE_NEW)
          }
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
            <p className="sectionHeadings">Datasources</p>
          </HeaderFlex>
          <SectionGrid
            isActiveTab={
              this.state.activePrimaryMenuId !== PRIMARY_MENU_IDS.ACTIVE
            }
          >
            <MainTabsContainer>
              {showTabs && (
                <TabComponent
                  onSelect={this.onSelectPrimaryMenu}
                  selectedIndex={this.state.activePrimaryMenuId}
                  tabs={PRIMARY_MENU}
                />
              )}
            </MainTabsContainer>
            {this.state.activePrimaryMenuId !== PRIMARY_MENU_IDS.ACTIVE && (
              <div />
            )}

            {currentScreen}
            {activePrimaryMenuId === PRIMARY_MENU_IDS.CREATE_NEW && (
              <TabComponent
                className="t--vertical-menu"
                onSelect={this.onSelectSecondaryMenu}
                selectedIndex={this.state.activeSecondaryMenuId}
                tabs={
                  this.props.mockDatasources.length > 0
                    ? getSecondaryMenu(dataSources.length > 0)
                    : SECONDARY_MENU
                }
                vertical
              />
            )}
          </SectionGrid>
        </ApiHomePage>
      </>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    dataSources: getDatasources(state),
    mockDatasources: getMockDatasources(state),
    isCreating: state.ui.apiPane.isCreating,
    applicationId: getCurrentApplicationId(state),
  };
};

export default connect(mapStateToProps)(
  reduxForm<{ category: string }, IntegrationsHomeScreenProps>({
    form: API_HOME_SCREEN_FORM,
  })(IntegrationsHomeScreen),
);
