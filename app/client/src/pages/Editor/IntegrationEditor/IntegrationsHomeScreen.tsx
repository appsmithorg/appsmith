import React, { useEffect, useRef } from "react";
import { connect } from "react-redux";
import { reduxForm, InjectedFormProps } from "redux-form";
import styled from "styled-components";
import { AppState } from "reducers";
import { API_HOME_SCREEN_FORM } from "constants/forms";
import { searchApiOrProvider } from "actions/providerActions";
import { Colors } from "constants/Colors";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import CloseEditor from "components/editorComponents/CloseEditor";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { IconSize } from "components/ads/Icon";
import NewApiScreen from "./NewApi";
import NewQueryScreen from "./NewQuery";
import ActiveQueryScreen from "./ActiveQuery";
import AddDatasourceSecurely from "./AddDatasourceSecurely";
import { getDBDatasources } from "selectors/entitiesSelector";
import { Datasource } from "entities/Datasource";
import Text, { TextType } from "components/ads/Text";

const SearchContainer = styled.div`
  display: flex;
  width: 100%;
  .closeBtn {
    position: absolute;
    left: 70%;
  }
`;

const SearchBar = styled(BaseTextInput)`
  margin-bottom: 10px;
  input {
    background-color: ${Colors.WHITE};
    border: 1px solid ${Colors.GEYSER};
  }
`;

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
  min-height: 95vh;
  max-height: 95vh;
  overflow: hidden !important;
  .closeBtn {
    position: absolute;
    left: 70%;
  }
  .searchResultsContainer {
    background-color: ${Colors.WHITE};
    z-index: 9999;
    width: 70%;
    padding: 20px;
    border: 1px solid ${Colors.ALTO};
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
    position: absolute;
    border-radius: 4px;
    max-height: 80vh;
    overflow: auto;
  }
  .searchCloseBtn {
    float: right;
    cursor: pointer;
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
  max-height: calc(100vh - 440px);
  padding-bottom: 75px;
  margin-top: 16px;
  & > div {
    margin-bottom: 16px;
  }
`;

type IntegrationsHomeScreenProps = {
  searchApiOrProvider: (searchKey: string) => void;
  pageId: string;
  applicationId: string;
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
  showSearchResults: boolean;
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
];

const SECONDARY_MENU_IDS = {
  // MOST_USED: 0,
  API: 0,
  DATABASE: 1,
  // SAAS: 3,
};

const TERTIARY_MENU: TabProp[] = [
  {
    key: "ACTIVE_CONNECTIONS",
    title: "Active Connections",
    panelComponent: <div />,
  },
  {
    key: "MOCK_DATABASE",
    title: "Mock Databases",
    panelComponent: <div />,
  },
];

const TERTIARY_MENU_IDS = {
  ACTIVE_CONNECTIONS: 0,
  MOCK_DATABASE: 1,
};

function CreateNewAPI({ active, applicationId, history, pageId }: any) {
  const newAPIRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active) {
      newAPIRef.current?.scrollIntoView({ behavior: "smooth" });
      newAPIRef.current?.click();
    }
  }, [active]);
  return (
    <div id="new-api" ref={newAPIRef}>
      <Text type={TextType.H2}>APIs</Text>
      <NewApiScreen
        applicationId={applicationId}
        history={history}
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
    if (active) {
      newDatasourceRef.current?.scrollIntoView({ behavior: "smooth" });
      newDatasourceRef.current?.click();
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
      showSearchResults: false,
      activePrimaryMenuId: PRIMARY_MENU_IDS.CREATE_NEW,
      activeSecondaryMenuId: SECONDARY_MENU_IDS.API,
    };
  }

  onSelectPrimaryMenu = (activePrimaryMenuId: number) => {
    if (activePrimaryMenuId === this.state.activePrimaryMenuId) {
      return;
    } else if (activePrimaryMenuId === PRIMARY_MENU_IDS.ACTIVE) {
      this.setState({
        activePrimaryMenuId,
        activeSecondaryMenuId: TERTIARY_MENU_IDS.ACTIVE_CONNECTIONS,
      });
    } else {
      this.setState({
        activePrimaryMenuId,
        activeSecondaryMenuId: SECONDARY_MENU_IDS.API,
      });
    }
  };

  onSelectSecondaryMenu = (activeSecondaryMenuId: number) => {
    this.setState({ activeSecondaryMenuId });
  };

  handleSearchChange = (e: React.ChangeEvent<{ value: string }>) => {
    const { searchApiOrProvider } = this.props;
    const value = e.target.value;
    if (value) {
      searchApiOrProvider(value);
      this.setState({ showSearchResults: true });
    } else {
      this.setState({ showSearchResults: false });
    }
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
    const { showSearchResults } = this.state;
    let currentScreen = null;
    const { activePrimaryMenuId, activeSecondaryMenuId } = this.state;
    if (activePrimaryMenuId === PRIMARY_MENU_IDS.CREATE_NEW) {
      currentScreen = (
        <div>
          <AddDatasourceSecurely />
          <NewIntegrationsContainer>
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
        </div>
      );
    } else {
      currentScreen = (
        <ActiveQueryScreen
          applicationId={applicationId}
          dataSources={dataSources}
          history={this.props.history}
          isCreating={isCreating}
          location={location}
          pageId={pageId}
        />
      );
    }
    return (
      <ApiHomePage
        className="t--integrationsHomePage"
        style={{ overflow: showSearchResults ? "hidden" : "auto" }}
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
          {/* TODO: make this search bar work */}
          <SearchContainer>
            <SearchBar
              icon="search"
              input={{
                onChange: this.handleSearchChange,
                onFocus: (e) => {
                  if (e.target.value) {
                    this.setState({ showSearchResults: true });
                  } else {
                    this.setState({ showSearchResults: false });
                  }
                },
              }}
              placeholder="Search"
            />
          </SearchContainer>

          {currentScreen}

          <TabComponent
            onSelect={this.onSelectSecondaryMenu}
            selectedIndex={this.state.activeSecondaryMenuId}
            tabs={
              activePrimaryMenuId === PRIMARY_MENU_IDS.ACTIVE
                ? TERTIARY_MENU
                : SECONDARY_MENU
            }
            vertical
          />
        </SectionGrid>
      </ApiHomePage>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  return {
    dataSources: getDBDatasources(state),
    isCreating: state.ui.apiPane.isCreating,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  searchApiOrProvider: (searchKey: string) =>
    dispatch(searchApiOrProvider({ searchKey })),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<{ category: string }, IntegrationsHomeScreenProps>({
    form: API_HOME_SCREEN_FORM,
  })(IntegrationsHomeScreen),
);
