import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { reduxForm, InjectedFormProps, getFormValues } from "redux-form";
import { Icon, Card } from "@blueprintjs/core";
import styled from "styled-components";
// import InfiniteScroll from "react-infinite-scroller";
import { DEFAULT_PROVIDER_OPTION } from "constants/ApiEditorConstants";
import {
  getCurlImportPageURL,
  // getProviderTemplatesURL,
} from "constants/routes";
import { SAAS_EDITOR_URL } from "pages/Editor/SaaSEditor/constants";
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
import CurlLogo from "assets/images/Curl-logo.svg";
import { FetchProviderWithCategoryRequest } from "api/ProvidersApi";
import { Plugin } from "api/PluginApi";
import { createNewApiAction, setCurrentCategory } from "actions/apiPaneActions";
// import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import AnalyticsUtil, { EventLocation } from "utils/AnalyticsUtil";
import { getAppsmithConfigs } from "configs";
import { getAppCardColorPalette } from "selectors/themeSelectors";
import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import CloseEditor from "components/editorComponents/CloseEditor";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { PluginType } from "entities/Action";
import { IconSize } from "components/ads/Icon";
const { enableRapidAPI } = getAppsmithConfigs();

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
  overflow: auto;
  padding-bottom: 50px;
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

const StyledContainer = styled.div`
  flex: 1;

  .sectionHeadings {
    font-weight: 500;
    font-size: 16px;
  }
  .link {
    color: ${Colors.OXFORD_BLUE};
  }
  .link:hover {
    color: ${Colors.OXFORD_BLUE};
    text-decoration: none !important;
  }
  .textBtn {
    font-size: 14px;
    justify-content: center;
    text-align: center;
    letter-spacing: -0.17px;
    color: ${Colors.OXFORD_BLUE};
    font-weight: 500;
    text-decoration: none !important;
    flex-wrap: wrap;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (min-width: 2500px) {
    .textBtn {
      font-size: 18px;
    }
  }
  .link {
    color: ${Colors.OXFORD_BLUE};
  }
  a:hover {
    color: ${Colors.OXFORD_BLUE};
    text-decoration: none;
  }
  .providerSearchCard {
    display: flex;
    color: ${Colors.BLACK};
    padding: 5px;
    cursor: pointer;
  }
  .providerSearchCard:hover {
    background-color: ${Colors.CONCRETE};
  }
  .providerSearchResultImage {
    height: 50px;
    width: 60px;
    object-fit: contain;
  }
  .providerSearchResultName {
    display: flex;
    align-self: center;
    padding-left: 15px;
    font-size: 16px;
  }
  .apiImage {
    object-fit: contain;
    height: 50px;
    width: auto;
    max-width: 100%;
    margin-top: -5px;
    margin-bottom: 10px;
    min-height: 50px;
  }
  .curlImage {
    width: 55px;
  }
  .saasImage.t--saas-google-sheets-plugin-image {
    width: 40px;
  }
  .createIcon {
    align-items: center;
    margin-top: 15px;
    margin-bottom: 25px;
  }
  .eachCard {
    margin: 15px;
    width: 140px;
    height: 110px;
    padding-bottom: 0px;
    cursor: pointer;
    border: 1px solid #e6e6e6;
    box-shadow: none;
  }
  .eachCard:active {
    border: 1px solid ${Colors.JAFFA_DARK};
    background: rgba(242, 153, 74, 0.17);
  }
  .eachCard:hover {
    border: 1px solid ${Colors.JAFFA_DARK};
  }
  @media (min-width: 2500px) {
    .eachCard {
      width: 240px;
      height: 200px;
    }
    .apiImage {
      margin-top: 25px;
      margin-bottom: 20px;
      height: 80px;
    }
    .curlImage {
      width: 100px;
    }
    .createIcon {
      height: 70px;
    }
  }
`;

const ApiCard = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  column-gap: 10px;
  flex-wrap: wrap;
  margin-left: -10px;
  text-align: center;
  min-width: 150px;
  border-radius: 4px;
  width: 100%;
  @media (min-width: 2500px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
`;

const SectionGrid = styled.div`
  margin-top: 36px;
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 10px;
`;

type ApiHomeScreenProps = {
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
};

type ApiHomeScreenState = {
  page: number;
  showSearchResults: boolean;
  mainTab: number;
};

type Props = ApiHomeScreenProps &
  InjectedFormProps<{ category: string }, ApiHomeScreenProps>;

const MAIN_TABS: TabProp[] = [
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

class ApiHomeScreen extends React.Component<Props, ApiHomeScreenState> {
  constructor(props: Props) {
    super(props);

    this.state = {
      page: 1,
      showSearchResults: false,
      mainTab: 0,
    };
  }

  onChooseMainTab = (idx: number) => {
    this.setState({ mainTab: idx });
  };

  componentDidMount() {
    const {
      importedCollections,
      providerCategories,
      providersTotal,
    } = this.props;
    if (providerCategories.length === 0 && enableRapidAPI) {
      this.props.fetchProviderCategories();
    }
    if (importedCollections.length === 0 && enableRapidAPI) {
      this.props.fetchImportedCollections();
    }
    if (!providersTotal && enableRapidAPI) {
      this.props.clearProviders();
      this.props.change("category", DEFAULT_PROVIDER_OPTION);
      this.props.fetchProvidersWithCategory({
        category: DEFAULT_PROVIDER_OPTION,
        page: 1,
      });
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.currentCategory !== this.props.currentCategory &&
      this.props.currentCategory !== this.props.previouslySetCategory &&
      enableRapidAPI
    ) {
      this.props.setCurrentCategory(this.props.currentCategory);
      this.props.clearProviders();
      this.props.fetchProvidersWithCategory({
        category: this.props.currentCategory,
        page: 1,
      });
    }
  }

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
      history,
      // isSwitchingCategory,
      // isFetchingProviders,
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
    const curlImportURL =
      getCurlImportPageURL(applicationId, pageId) + location.search;

    const newApiComponent = (
      <StyledContainer>
        <ApiCard>
          <Card
            className="eachCard t--createBlankApiCard"
            interactive={false}
            onClick={this.handleCreateNew}
          >
            <Icon className="createIcon" icon="plus" iconSize={20} />
            <p className="textBtn">Create new</p>
          </Card>
          <Link
            onClick={() => {
              AnalyticsUtil.logEvent("IMPORT_API_CLICK", {
                importSource: CURL,
              });
            }}
            to={curlImportURL}
          >
            <Card className="eachCard" interactive={false}>
              <img
                alt="CURL"
                className="curlImage t--curlImage"
                src={CurlLogo}
              />
              <p className="textBtn">CURL</p>
            </Card>
          </Link>
          {this.props.plugins
            .filter((p) => p.type === PluginType.SAAS)
            .map((p) => (
              <Link
                key={p.id}
                to={
                  SAAS_EDITOR_URL(applicationId, pageId, p.packageName) +
                  location.search
                }
              >
                <Card className="eachCard" interactive={false}>
                  <img
                    alt={p.name}
                    className={"saasImage t--saas-" + p.packageName + "-image"}
                    src={p.iconLocation}
                  />
                  <p className="textBtn">{p.name}</p>
                </Card>
              </Link>
            ))}
        </ApiCard>
      </StyledContainer>
    );

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
              onSelect={this.onChooseMainTab}
              selectedIndex={this.state.mainTab}
              tabs={MAIN_TABS}
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

          {newApiComponent}

          <p>temp sidebar</p>
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
    isSwitchingCategory,
    apiOrProviderSearchResults,
    previouslySetCategory: state.ui.apiPane.currentCategory,
    initialValues: { category: initialCategoryValue },
    fetchProvidersError,
    colorPalette: getAppCardColorPalette(state),
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
  reduxForm<{ category: string }, ApiHomeScreenProps>({
    form: API_HOME_SCREEN_FORM,
  })(ApiHomeScreen),
);
