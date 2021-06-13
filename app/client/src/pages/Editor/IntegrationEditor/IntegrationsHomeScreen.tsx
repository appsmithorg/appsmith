import React, { useEffect, useRef } from "react";
// import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { reduxForm, InjectedFormProps, getFormValues } from "redux-form";
// import { Icon, Card } from "@blueprintjs/core";
import styled from "styled-components";
// import InfiniteScroll from "react-infinite-scroller";
import { DEFAULT_PROVIDER_OPTION } from "constants/ApiEditorConstants";
// import {
//   getCurlImportPageURL,
//   // getProviderTemplatesURL,
// } from "constants/routes";
// import { SAAS_EDITOR_URL } from "pages/Editor/SaaSEditor/constants";
import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { getImportedCollections } from "selectors/applicationSelectors";
import { TemplateList } from "constants/collectionsConstants";
import {
  ProvidersDataArray,
  SearchResultsProviders,
} from "constants/providerConstants";
import {
  getProviders,
  getProvidersLoadingState,
} from "selectors/applicationSelectors";
import { getProviderCategories } from "selectors/editorSelectors";
import { fetchImportedCollections } from "actions/collectionAction";
import { API_HOME_SCREEN_FORM } from "constants/forms";
import {
  fetchProviders,
  fetchProviderCategories,
  fetchProvidersWithCategory,
  clearProviders,
  searchApiOrProvider,
} from "actions/providerActions";
import { Colors } from "constants/Colors";
// import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import { API_EDITOR_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";
// import DropdownField from "components/editorComponents/form/fields/DropdownField";
// import Spinner from "components/editorComponents/Spinner";
// import CurlLogo from "assets/images/Curl-logo.svg";
import { FetchProviderWithCategoryRequest } from "api/ProvidersApi";
import { Plugin } from "api/PluginApi";
import { createNewApiAction, setCurrentCategory } from "actions/apiPaneActions";
import { EventLocation } from "utils/AnalyticsUtil";
import { getAppCardColorPalette } from "selectors/themeSelectors";
// import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import CloseEditor from "components/editorComponents/CloseEditor";
import { TabComponent, TabProp } from "components/ads/Tabs";
// import { PluginType } from "entities/Action";
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
  initialValues: {
    category: string;
  };
  currentCategory: string;
  importedCollections: TemplateList[];
  fetchImportedCollections: () => void;
  providers: ProvidersDataArray[];
  fetchProviders: () => void;
  clearProviders: () => void;
  fetchProviderCategories: () => void;
  searchApiOrProvider: (searchKey: string) => void;
  providerCategories: string[];
  apiOrProviderSearchResults: {
    providers: SearchResultsProviders[];
  };
  pageId: string;
  plugins: Plugin[];
  applicationId: string;
  actions: ActionDataState;
  fetchProvidersWithCategory: (
    request: FetchProviderWithCategoryRequest,
  ) => void;
  location: {
    search: string;
  };
  match: {
    url: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  isFetchingProviders: boolean;
  providersTotal: number;
  isSwitchingCategory: boolean;
  createNewApiAction: (pageId: string, from: EventLocation) => void;
  setCurrentCategory: (category: string) => void;
  previouslySetCategory: string;
  fetchProvidersError: boolean;
  colorPalette: string[];
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

  handleCreateNew = () => {
    const pageId = new URLSearchParams(this.props.location.search).get(
      "importTo",
    );
    if (pageId) {
      this.props.createNewApiAction(pageId, "API_PANE");
    }
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

  handleFetchMoreProviders = (page: number) => {
    const { currentCategory } = this.props;
    this.props.fetchProvidersWithCategory({
      category: currentCategory,
      page: page,
    });
  };

  render() {
    const {
      // importedCollections,
      // apiOrProviderSearchResults,
      applicationId,
      // fetchProvidersError,
      dataSources,
      // isSwitchingCategory,
      // isFetchingProviders,
      history,
      isCreating,
      location,
      pageId,
      // providerCategories,
      // providers,
      // providersTotal,
    } = this.props;
    const { showSearchResults } = this.state;

    let destinationPageId = new URLSearchParams(location.search).get(
      "importTo",
    );

    if (!destinationPageId) {
      destinationPageId = pageId;
      history.push(
        API_EDITOR_URL_WITH_SELECTED_PAGE_ID(applicationId, pageId, pageId),
      );
    }

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
        className="t--apiHomePage"
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
  const { providers } = state.ui;
  const {
    apiOrProviderSearchResults,
    fetchProvidersError,
    isSwitchingCategory,
    providersTotal,
  } = providers;
  const formData = getFormValues(API_HOME_SCREEN_FORM)(
    state,
  ) as FetchProviderWithCategoryRequest;
  let category = DEFAULT_PROVIDER_OPTION;

  if (formData) {
    category = formData.category;
  }

  let initialCategoryValue;
  if (state.ui.apiPane.currentCategory === "") {
    initialCategoryValue = DEFAULT_PROVIDER_OPTION;
  } else {
    initialCategoryValue = state.ui.apiPane.currentCategory;
  }

  return {
    currentCategory: category,
    importedCollections: getImportedCollections(state),
    providers: getProviders(state),
    isFetchingProviders: getProvidersLoadingState(state),
    actions: state.entities.actions,
    providersTotal,
    providerCategories: getProviderCategories(state),
    plugins: state.entities.plugins.list,
    dataSources: getDBDatasources(state),
    isSwitchingCategory,
    apiOrProviderSearchResults,
    previouslySetCategory: state.ui.apiPane.currentCategory,
    initialValues: { category: initialCategoryValue },
    fetchProvidersError,
    colorPalette: getAppCardColorPalette(state),
    isCreating: state.ui.apiPane.isCreating,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  fetchImportedCollections: () => dispatch(fetchImportedCollections()),
  fetchProviders: () => dispatch(fetchProviders()),
  clearProviders: () => dispatch(clearProviders()),
  fetchProviderCategories: () => dispatch(fetchProviderCategories()),
  fetchProvidersWithCategory: (request: FetchProviderWithCategoryRequest) =>
    dispatch(fetchProvidersWithCategory(request)),
  searchApiOrProvider: (searchKey: string) =>
    dispatch(searchApiOrProvider({ searchKey })),
  createNewApiAction: (pageId: string, from: EventLocation) =>
    dispatch(createNewApiAction(pageId, from)),
  setCurrentCategory: (category: string) =>
    dispatch(setCurrentCategory(category)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<{ category: string }, IntegrationsHomeScreenProps>({
    form: API_HOME_SCREEN_FORM,
  })(IntegrationsHomeScreen),
);
