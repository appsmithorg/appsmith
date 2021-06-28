import React, { useEffect, useRef } from "react";
import { connect } from "react-redux";
import { reduxForm, InjectedFormProps } from "redux-form";
import styled from "styled-components";
import { AppState } from "reducers";
import { API_HOME_SCREEN_FORM } from "constants/forms";
import { Colors } from "constants/Colors";
import CloseEditor from "components/editorComponents/CloseEditor";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { IconSize } from "components/ads/Icon";
import NewApiScreen from "./NewApi";
import NewQueryScreen from "./NewQuery";
import ActiveDataSource from "./ActiveDataSources";
import AddDatasourceSecurely from "./AddDatasourceSecurely";
import { getDatasources } from "selectors/entitiesSelector";
import { Datasource } from "entities/Datasource";
import Text, { TextType } from "components/ads/Text";
import scrollIntoView from "scroll-into-view-if-needed";
import {
  INTEGRATION_TABS,
  INTEGRATION_EDITOR_URL,
  INTEGRATION_EDITOR_MODES,
} from "constants/routes";

const HeaderFlex = styled.div`
  display: flex;
  align-items: center;
  & > p {
    margin: 0 0 0 8px;
  }
`;

const ApiHomePage = styled.div`
  font-size: 20px;
  padding: 20px;
  /* margin-left: 10px; */
  min-height: 100%;
  max-height: 100%;
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

const SectionGrid = styled.div`
  margin-top: 36px;
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 10px;
`;
const NewIntegrationsContainer = styled.div`
  scrollbar-width: thin;
  overflow: auto;
  max-height: calc(
    100vh - ${(props) => props.theme.integrationsPageUnusableHeight}
  );
  /* padding-bottom: 300px; */
  /* margin-top: 16px; */
  & > div {
    margin-bottom: 16px;
  }
`;

type IntegrationsHomeScreenProps = {
  pageId: string;
  applicationId: string;
  selectedTab: string;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  isCreating: boolean;
  dataSources: Datasource[];
};

type IntegrationsHomeScreenState = {
  page: number;
  activePrimaryMenuId: number;
  activeSecondaryMenuId: number;
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
  {
    key: "MOCK_DATABASE",
    title: "Mock Databases",
    panelComponent: <div />,
  },
];

const SECONDARY_MENU_IDS = {
  API: 0,
  DATABASE: 1,
  MOCK_DATABASE: 2,
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

function CreateNewAPI({
  active,
  applicationId,
  history,
  isCreating,
  pageId,
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
        applicationId={applicationId}
        history={history}
        isCreating={isCreating}
        location={location}
        pageId={pageId}
      />
    </div>
  );
}

function CreateNewDatasource({
  active,
  applicationId,
  history,
  isCreating,
  pageId,
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
        applicationId={applicationId}
        history={history}
        isCreating={isCreating}
        location={location}
        pageId={pageId}
      />
    </div>
  );
}

class IntegrationsHomeScreen extends React.Component<
  Props,
  IntegrationsHomeScreenState
> {
  constructor(props: Props) {
    super(props);
    console.log("INtegrations Home screen");

    this.state = {
      page: 1,
      activePrimaryMenuId: PRIMARY_MENU_IDS.CREATE_NEW,
      activeSecondaryMenuId: SECONDARY_MENU_IDS.API,
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
    const {
      applicationId,
      dataSources,
      history,
      location,
      pageId,
    } = this.props;
    const params: string = location.search;
    const redirectMode = new URLSearchParams(params).get("mode");
    if (
      dataSources.length > 0 &&
      redirectMode === INTEGRATION_EDITOR_MODES.AUTO
    ) {
      // User will be taken to active tab if there are datasources
      history.push(
        INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.ACTIVE),
      );
    } else if (redirectMode === INTEGRATION_EDITOR_MODES.MOCK) {
      // If there are no datasources -> new user
      history.push(
        INTEGRATION_EDITOR_URL(applicationId, pageId, INTEGRATION_TABS.NEW),
      );
      this.onSelectSecondaryMenu(SECONDARY_MENU_IDS.MOCK_DATABASE);
    } else {
      this.syncActivePrimaryMenu();
    }
  }

  componentDidUpdate() {
    this.syncActivePrimaryMenu();
  }

  onSelectPrimaryMenu = (activePrimaryMenuId: number) => {
    const { applicationId, history, pageId } = this.props;
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
          : SECONDARY_MENU_IDS.API,
    });
  };

  onSelectSecondaryMenu = (activeSecondaryMenuId: number) => {
    this.setState({ activeSecondaryMenuId });
  };

  render() {
    const {
      applicationId,
      dataSources,
      history,
      isCreating,
      location,
      pageId,
    } = this.props;

    let currentScreen = null;
    const { activePrimaryMenuId, activeSecondaryMenuId } = this.state;
    if (activePrimaryMenuId === PRIMARY_MENU_IDS.CREATE_NEW) {
      currentScreen = (
        <NewIntegrationsContainer id="new-integrations-wrapper">
          {dataSources.length === 0 && <AddDatasourceSecurely />}
          <CreateNewAPI
            active={activeSecondaryMenuId === SECONDARY_MENU_IDS.API}
            applicationId={applicationId}
            history={history}
            isCreating={isCreating}
            location={location}
            pageId={pageId}
          />
          <CreateNewDatasource
            active={activeSecondaryMenuId === SECONDARY_MENU_IDS.DATABASE}
            applicationId={applicationId}
            history={history}
            isCreating={isCreating}
            location={location}
            pageId={pageId}
          />
        </NewIntegrationsContainer>
      );
    } else {
      currentScreen = (
        <ActiveDataSource
          applicationId={applicationId}
          dataSources={dataSources}
          history={this.props.history}
          isCreating={isCreating}
          location={location}
          onCreateNew={() =>
            this.onSelectPrimaryMenu(PRIMARY_MENU_IDS.CREATE_NEW)
          }
          pageId={pageId}
        />
      );
    }
    return (
      <ApiHomePage
        className="t--integrationsHomePage"
        style={{ overflow: "auto" }}
      >
        <HeaderFlex>
          <CloseEditor />
          <p className="sectionHeadings">Integrations</p>
        </HeaderFlex>
        <SectionGrid>
          <MainTabsContainer>
            <TabComponent
              onSelect={this.onSelectPrimaryMenu}
              selectedIndex={this.state.activePrimaryMenuId}
              tabs={PRIMARY_MENU}
            />
          </MainTabsContainer>
          <div />

          {currentScreen}
          {activePrimaryMenuId === PRIMARY_MENU_IDS.CREATE_NEW ? (
            <TabComponent
              onSelect={this.onSelectSecondaryMenu}
              selectedIndex={this.state.activeSecondaryMenuId}
              tabs={SECONDARY_MENU}
              vertical
            />
          ) : (
            <div />
          )}
        </SectionGrid>
      </ApiHomePage>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    dataSources: getDatasources(state),
    isCreating: state.ui.apiPane.isCreating,
  };
};

export default connect(mapStateToProps)(
  reduxForm<{ category: string }, IntegrationsHomeScreenProps>({
    form: API_HOME_SCREEN_FORM,
  })(IntegrationsHomeScreen),
);
