import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { reduxForm, InjectedFormProps, getFormValues } from "redux-form";
import { Icon, Card } from "@blueprintjs/core";
import styled from "styled-components";
import InfiniteScroll from "react-infinite-scroller";
import { DEFAULT_PROVIDER_OPTION } from "constants/ApiEditorConstants";
import {
  getCurlImportPageURL,
  getProviderTemplatesURL,
} from "constants/routes";
import { RestAction } from "api/ActionAPI";
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
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import { API_EDITOR_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import Spinner from "components/editorComponents/Spinner";
// import PostmanLogo from "assets/images/Postman-logo.svg";
import CurlLogo from "assets/images/Curl-logo.svg";
import { FetchProviderWithCategoryRequest } from "api/ProvidersApi";
import { Plugin } from "api/PluginApi";
import {
  createNewApiAction,
  setCurrentCategory,
  setLastUsedEditorPage,
} from "actions/apiPaneActions";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { CURL } from "constants/ApiConstants";

const SearchContainer = styled.div`
  display: flex;
  width: 40%;
  .closeBtn {
    position: absolute;
    left: 70%;
  }
`;

const SearchBar = styled(BaseTextInput)`
  margin-bottom: 10px;
  input {
    background-color: ${Colors.WHITE};
    1px solid ${Colors.GEYSER};
  }
`;

const ApiHomePage = styled.div`
  font-size: 20px;
  padding: 20px;
  margin-left: 10px;
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

const StyledContainer = styled.div`
  flex: 1;
  padding-top: 12px;
  padding-bottom: 12px;

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
    width: 60px;
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
`;

const CardList = styled.div`
  margin: 15px;
  .eachProviderCard {
    width: 140px;
    height: 110px;
    padding-bottom: 0px;
    cursor: pointer;
    border: 1px solid #e6e6e6;
    box-shadow: none;
  }
  .eachProviderCard:active {
    border: 1px solid ${Colors.JAFFA_DARK};
    background: rgba(242, 153, 74, 0.17);
  }
  .eachProviderCard:hover {
    border: 1px solid ${Colors.JAFFA_DARK};
  }
`;

// const NoCollections = styled.div`
//   padding-top: 52px;
//   padding-bottom: 50px;
//   text-align: center;
//   width: 438px;
//   margin: 0 auto;
//   color: #666666;
//   font-size: 14px;
//   line-height: 24px;
// `;
//
// const ImportedApisCard = styled.div`
//   flex: 1;
//   display: inline-flex;
//   flex-wrap: wrap;
//   margin-left: -10px;
//   justify-content: flex-start;
//   text-align: center;
//   border-radius: 4px;
//
//   .importedApiIcon {
//     display: flex;
//     height: 30px;
//     width: 30px;
//     margin-right: 15px;
//     color: ${Colors.OXFORD_BLUE};
//   }
//   .eachImportedApiCard {
//     margin: 10px;
//     width: 225px;
//     height: 60px;
//     display: flex;
//     flex-wrap: wrap;
//   }
// `;

const DropdownSelect = styled.div`
  font-size: 14px;
  float: right;
  width: 232px;
  margin-right: 25px;
  margin-bottom: 25px;
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const PageLoadingContainer = styled(CenteredWrapper)`
  margin-top: 100px;
  height: 50%;
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
  createNewApiAction: (pageId: string) => void;
  setCurrentCategory: (category: string) => void;
  setLastUsedEditorPage: (path: string) => void;
  previouslySetCategory: string;
  fetchProvidersError: boolean;
};

type ApiHomeScreenState = {
  page: number;
  showSearchResults: boolean;
};

type Props = ApiHomeScreenProps &
  InjectedFormProps<{ category: string }, ApiHomeScreenProps>;

class ApiHomeScreen extends React.Component<Props, ApiHomeScreenState> {
  constructor(props: Props) {
    super(props);

    this.state = {
      page: 1,
      showSearchResults: false,
    };
  }

  componentDidMount() {
    const {
      importedCollections,
      providersTotal,
      providerCategories,
    } = this.props;
    if (providerCategories.length === 0) {
      this.props.fetchProviderCategories();
    }
    if (importedCollections.length === 0) {
      this.props.fetchImportedCollections();
    }
    if (!providersTotal) {
      this.props.clearProviders();
      this.props.change("category", DEFAULT_PROVIDER_OPTION);
      this.props.fetchProvidersWithCategory({
        category: DEFAULT_PROVIDER_OPTION,
        page: 1,
      });
    }
    this.props.setLastUsedEditorPage(this.props.match.url);
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.currentCategory !== this.props.currentCategory &&
      this.props.currentCategory !== this.props.previouslySetCategory
    ) {
      this.props.setCurrentCategory(this.props.currentCategory);
      this.props.clearProviders();
      this.props.fetchProvidersWithCategory({
        category: this.props.currentCategory,
        page: 1,
      });
    }
  }

  handleCreateNew = (params: string) => {
    const pageId = new URLSearchParams(params).get("importTo");
    if (pageId) {
      this.props.createNewApiAction(pageId);
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
      providers,
      applicationId,
      pageId,
      location,
      history,
      // isFetchingProviders,
      providerCategories,
      providersTotal,
      isSwitchingCategory,
      apiOrProviderSearchResults,
      fetchProvidersError,
    } = this.props;
    const { showSearchResults } = this.state;

    const queryParams: string = location.search;
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

    const PROVIDER_CATEGORIES_OPTIONS = providerCategories.map(category => ({
      label: category,
      value: category,
    }));

    const ApiHomepageTopSection = (
      <React.Fragment>
        <SearchContainer>
          <SearchBar
            icon="search"
            input={{
              onChange: this.handleSearchChange,
              onFocus: e => {
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
        <div>
          {showSearchResults && (
            <div className="searchResultsContainer">
              <Icon
                icon="cross"
                iconSize={20}
                className="searchCloseBtn"
                onClick={() => {
                  this.setState({ showSearchResults: false });
                }}
              />
              <StyledContainer>
                <div>
                  <p className="sectionHeadings">{"Providers"}</p>
                  {apiOrProviderSearchResults.providers.map(
                    providerSearchResult => (
                      <React.Fragment key={providerSearchResult.id}>
                        <p
                          className="providerSearchCard"
                          onClick={() =>
                            history.push(
                              getProviderTemplatesURL(
                                applicationId,
                                pageId,
                                providerSearchResult.id +
                                  `/?importTo=${destinationPageId}`,
                              ),
                            )
                          }
                        >
                          {providerSearchResult.imageUrl ? (
                            <img
                              src={providerSearchResult.imageUrl}
                              className="providerSearchResultImage"
                              alt="img"
                            />
                          ) : (
                            <div
                              style={{
                                backgroundColor: getInitialsAndColorCode(
                                  providerSearchResult.name,
                                )[1],
                                padding: 11,
                                width: 60,
                                color: "#fff",
                                borderRadius: 2,
                                fontSize: 16,
                                fontWeight: "bold",
                                textAlign: "center",
                              }}
                            >
                              <span>
                                {
                                  getInitialsAndColorCode(
                                    providerSearchResult.name,
                                  )[0]
                                }
                              </span>
                            </div>
                          )}
                          <span className="providerSearchResultName">
                            {providerSearchResult.name}
                            {/* |{" "} {providerSearchResult.noOfApis} APIs */}
                          </span>
                        </p>
                      </React.Fragment>
                    ),
                  )}
                </div>
              </StyledContainer>
            </div>
          )}
        </div>

        <StyledContainer>
          <p className="sectionHeadings">{"Import API"}</p>
          <ApiCard>
            <Card
              interactive={false}
              className="eachCard t--createBlankApiCard"
              onClick={() => this.handleCreateNew(queryParams)}
            >
              <Icon icon="plus" iconSize={20} className="createIcon" />
              <p className="textBtn">Create new</p>
            </Card>

            {/* <Card interactive={false} className="eachCard">
              <img src={PostmanLogo} className="apiImage" alt="Postman"></img>
              <p className="textBtn">Postman</p>
            </Card> */}

            <Link
              onClick={() => {
                AnalyticsUtil.logEvent("IMPORT_API_CLICK", {
                  importSource: CURL,
                });
              }}
              to={curlImportURL}
            >
              <Card interactive={false} className="eachCard">
                <img
                  src={CurlLogo}
                  className="curlImage t--curlImage"
                  alt="CURL"
                />
                <p className="textBtn">CURL</p>
              </Card>
            </Link>
          </ApiCard>
        </StyledContainer>

        {/* Imported APIs section start */}
        {/* <StyledContainer>
          <p className="sectionHeadings">{"Imported APIs"}</p>

          {importedCollections.length > 0 ? (
            <ImportedApisCard>
              {importedCollections.map(importedCollection => (
                <Card
                  key={importedCollection.id}
                  interactive={false}
                  className="eachImportedApiCard"
                >
                  <Icon
                    icon="folder-close"
                    iconSize={20}
                    className="importedApiIcon"
                  />
                  <p className="textBtn">{importedCollection.name}</p>
                </Card>
              ))}
            </ImportedApisCard>
          ) : (
            <NoCollections>
              <p>
                Your imported APIs will appear here. You can import APIs from
                the options in the above section.
              </p>
            </NoCollections>
          )}
        </StyledContainer> */}
      </React.Fragment>
    );

    return (
      <React.Fragment>
        <ApiHomePage
          style={{ overflow: showSearchResults ? "hidden" : "auto" }}
          className="t--apiHomePage"
        >
          {isSwitchingCategory ? (
            <>
              {ApiHomepageTopSection}
              <PageLoadingContainer>
                <Spinner size={30} />
              </PageLoadingContainer>
            </>
          ) : (
            <>
              <InfiniteScroll
                pageStart={0}
                initialLoad={false}
                loadMore={this.handleFetchMoreProviders.bind(this)}
                useWindow={false}
                hasMore={providers.length < providersTotal}
                loader={
                  <LoadingContainer>
                    <Spinner size={30} />
                  </LoadingContainer>
                }
              >
                {ApiHomepageTopSection}
                {/* Marketplace APIs section start */}
                <StyledContainer>
                  <div>
                    <div style={{ float: "left" }}>
                      <p className="sectionHeadings">{"Marketplace APIs"}</p>
                    </div>
                    <div>
                      <DropdownSelect>
                        <DropdownField
                          placeholder="All APIs"
                          width={232}
                          name="category"
                          options={PROVIDER_CATEGORIES_OPTIONS}
                        />
                      </DropdownSelect>
                    </div>
                  </div>

                  <br />
                  <br />

                  {isSwitchingCategory ? (
                    <LoadingContainer>
                      <Spinner size={30} />
                    </LoadingContainer>
                  ) : (
                    <>
                      {fetchProvidersError ? (
                        <div>
                          <p className="fontSize16">No providers found.</p>
                        </div>
                      ) : (
                        <div>
                          <ApiCard>
                            {providers.map((provider, index) => (
                              <CardList
                                key={index}
                                onClick={() => {
                                  AnalyticsUtil.logEvent("3P_PROVIDER_CLICK", {
                                    providerName: provider.name,
                                  });
                                  history.push(
                                    getProviderTemplatesURL(
                                      applicationId,
                                      pageId,
                                      provider.id +
                                        `/?importTo=${destinationPageId}`,
                                    ),
                                  );
                                }}
                              >
                                <Card
                                  interactive={false}
                                  className="eachProviderCard t--eachProviderCard"
                                >
                                  {provider.imageUrl ? (
                                    <img
                                      src={provider.imageUrl}
                                      className="apiImage"
                                      alt="Provider"
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        backgroundColor: getInitialsAndColorCode(
                                          provider.name,
                                        )[1],
                                        padding: 11,
                                        margin: "auto auto 10px",
                                        width: 70,
                                        color: "#fff",
                                        borderRadius: 2,
                                        fontSize: 24,
                                        fontWeight: "bold",
                                      }}
                                    >
                                      <span>
                                        {
                                          getInitialsAndColorCode(
                                            provider.name,
                                          )[0]
                                        }
                                      </span>
                                    </div>
                                  )}
                                  {provider.name && (
                                    <p
                                      className="textBtn"
                                      title={provider.name}
                                    >
                                      {provider.name}
                                    </p>
                                  )}
                                </Card>
                              </CardList>
                            ))}
                          </ApiCard>
                        </div>
                      )}
                    </>
                  )}
                </StyledContainer>
                {/* Marketplace APIs section end */}
              </InfiniteScroll>
            </>
          )}
        </ApiHomePage>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => {
  const { providers } = state.ui;
  const {
    providersTotal,
    isSwitchingCategory,
    fetchProvidersError,
    apiOrProviderSearchResults,
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
  createNewApiAction: (pageId: string) => dispatch(createNewApiAction(pageId)),
  setCurrentCategory: (category: string) =>
    dispatch(setCurrentCategory(category)),
  setLastUsedEditorPage: (path: string) =>
    dispatch(setLastUsedEditorPage(path)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  reduxForm<{ category: string }, ApiHomeScreenProps>({
    form: API_HOME_SCREEN_FORM,
  })(ApiHomeScreen),
);
