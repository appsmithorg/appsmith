import React from "react";
import { connect } from "react-redux";
import { Icon, Collapse } from "@blueprintjs/core";
import { RouteComponentProps } from "react-router-dom";
import styled from "styled-components";
import ReactJson from "react-json-view";
import { AppState } from "reducers";
import Button from "components/editorComponents/Button";
import { ProviderViewerRouteParams } from "constants/routes";
import {
  getProviderTemplates,
  getProvidersTemplatesLoadingState,
} from "selectors/applicationSelectors";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  ProviderTemplateArray,
  DEFAULT_TEMPLATE_TYPE,
} from "constants/providerConstants";
import { AddApiToPageRequest } from "api/ProvidersApi";
import {
  setLastUsedEditorPage,
  setLastSelectedPage,
} from "actions/apiPaneActions";
import {
  getProviderDetailsByProviderId,
  fetchProviderTemplates,
  addApiToPage,
} from "actions/providerActions";
import { Colors } from "constants/Colors";
import { getDuplicateName } from "utils/AppsmithUtils";
import { API_EDITOR_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import Spinner from "components/editorComponents/Spinner";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";

const TEMPLATES_TOP_SECTION_HEIGHT = "125px";

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

const ProviderInfo = styled.div`
  display: flex;
  padding: 10px;
  .providerImage {
    height: 40px;
    width: auto;
    margin-right: 11px;
  }
  .providerName {
    font-weight: 500;
    font-size: 16px;
    line-height: 32px;
  }
`;

const TemplateDetailPage = styled.div`
  max-height: 95vh;
  font-size: 20px;
  padding: 20px;

  .react-tabs__tab-list {
    border-bottom-color: transparent;
    color: #4e5d78;
    font-size: 14px;
    font-weight: 500;
  }

  .react-tabs__tab--selected {
    color: #2e3d49;
    font-size: 14px;
    font-weight: 500;
    border-color: transparent;
    border: transparent;
    border-bottom: 3px solid #2e3d49;
    border-radius: 0;
  }
  .backBtn {
    padding-bottom: 3px;
    cursor: pointer;
  }
  .backBtnText {
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
  }
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const ProviderInfoTopSection = styled.div`
  height: ${TEMPLATES_TOP_SECTION_HEIGHT};
`;

const TemplatesCardsContainer = styled.div`
  height: calc(
    100vh - ${TEMPLATES_TOP_SECTION_HEIGHT} -
      ${props => props.theme.headerHeight}
  );
  overflow: auto;
  .noProvidersMessage {
    margin-top: 30px;
    text-align: center;
    color: #666666;
    font-size: 14px;
    line-height: 24px;
  }
`;

const TemplateCard = styled.div`
  border: 1px solid #e8e8e8;
  min-height: 150px;
  padding: 17px;
  display: block;
  margin-bottom: 10px;
  .extraDescription {
    background: #363e44;
    border-radius: 4px;
    color: #fff;
  }
  .string-value {
    word-break: break-word !important;
  }
  .variable-value {
    word-break: break-word !important;
  }
`;

const CardTopContent = styled.div`
  display: flex;
`;

const TemplateCardLeftContent = styled.div`
  width: 70%;

  .apiName {
    font-size: 16px;
    line-height: 24px;
  }

  .desc {
    font-size: 14px;
    line-height: 24px;
  }
`;

const TemplateCardRightContent = styled.div`
  width: 30%;
  display: flex;
  margin: auto;
  justify-content: center;
  .dropIcon {
    margin-left: 50px;
    color: #bcccd9;
    cursor: pointer;
  }
  .addToPageBtn {
    width: 100px !important;
    height: 30px !important;
  }
`;

const URLContainer = styled.div`
  background: #ebeef0;
  padding: 1px;
  align-self: center;
  justify-content: center;
  border-radius: 4px;

  .urlText {
    color: #4e5d78;
    font-size: 14px;
    line-height: 24px;
    padding-top: 10px !important;
    padding-left: 11px;
  }
  .endpoint {
    padding-left: 11px;
  }
`;

type ProviderTemplatesProps = {
  providerTemplates: ProviderTemplateArray[];
  providerDetails: any;
  actions: ActionDataState;
  isFetchingProviderTemplates: boolean;
  getProviderDetailsByProviderId: (providerId: string) => void;
  getProviderTemplates: (providerId: string) => void;
  setLastUsedEditorPage: (path: string) => void;
  setLastSelectedPage: (selectedPageId: string) => void;
  addApiToPage: (templateData: AddApiToPageRequest) => void;
} & RouteComponentProps<ProviderViewerRouteParams>;

class ProviderTemplates extends React.Component<ProviderTemplatesProps> {
  public state = {
    isOpen: false,
    addedTemplates: Array<string>(),
    toggeledTemplates: Array<string>(),
  };

  handleClick = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  componentDidMount() {
    const { pageId, providerId } = this.props.match.params;
    let destinationPageId = new URLSearchParams(this.props.location.search).get(
      "importTo",
    );
    if (!destinationPageId) {
      destinationPageId = pageId;
    }
    this.props.getProviderDetailsByProviderId(providerId);
    this.props.getProviderTemplates(providerId);
    this.props.setLastUsedEditorPage(this.props.match.url);
    this.props.setLastSelectedPage(destinationPageId);
  }

  addApiToPage = (templateData: ProviderTemplateArray) => {
    const { pageId } = this.props.match.params;
    let destinationPageId = new URLSearchParams(this.props.location.search).get(
      "importTo",
    );
    if (!destinationPageId) {
      destinationPageId = pageId;
    }
    const pageApiNames = this.props.actions
      .filter(a => a.config.pageId === destinationPageId)
      .map(a => a.config.name);
    let name = templateData.templateData.name.replace(/ /g, "");
    if (pageApiNames.indexOf(name) > -1) {
      name = getDuplicateName(name, pageApiNames);
    }

    const addApiRequestObject: AddApiToPageRequest = {
      name,
      pageId: destinationPageId,
      marketplaceElement: {
        type: DEFAULT_TEMPLATE_TYPE,
        item: templateData.templateData,
      },
      source: "BROWSE",
    };
    const { addedTemplates } = this.state;
    this.props.addApiToPage(addApiRequestObject);
    this.setState({ addedTemplates });
  };

  handleSearchChange = (e: React.ChangeEvent<{ value: string }>) => {
    const value = e.target.value;
  };

  handleIsOpen = (templateId: string) => {
    const { toggeledTemplates } = this.state;

    const toggleCheck = toggeledTemplates.includes(templateId);
    if (toggleCheck) {
      toggeledTemplates.splice(toggeledTemplates.indexOf(templateId), 1);
      this.setState({ toggeledTemplates });
    } else {
      toggeledTemplates.push(templateId);
      this.setState({ toggeledTemplates });
    }
  };

  render() {
    const {
      providerTemplates,
      history,
      isFetchingProviderTemplates,
      providerDetails,
    } = this.props;
    const { applicationId, pageId } = this.props.match.params;

    let destinationPageId = new URLSearchParams(this.props.location.search).get(
      "importTo",
    );
    if (destinationPageId === null || destinationPageId === undefined) {
      destinationPageId = pageId;
    }

    if (isFetchingProviderTemplates) {
      return (
        <LoadingContainer>
          <Spinner size={30} />
        </LoadingContainer>
      );
    }
    return (
      <TemplateDetailPage>
        <ProviderInfoTopSection>
          <SearchContainer>
            <SearchBar
              icon="search"
              input={{
                onChange: this.handleSearchChange,
              }}
              placeholder="Search"
            />
          </SearchContainer>

          <Icon
            icon="chevron-left"
            iconSize={16}
            className="backBtn"
            onClick={() =>
              history.push(
                API_EDITOR_URL_WITH_SELECTED_PAGE_ID(
                  applicationId,
                  pageId,
                  destinationPageId ? destinationPageId : pageId,
                ),
              )
            }
          />
          <span
            className="backBtnText"
            onClick={() =>
              history.push(
                API_EDITOR_URL_WITH_SELECTED_PAGE_ID(
                  applicationId,
                  pageId,
                  destinationPageId ? destinationPageId : pageId,
                ),
              )
            }
          >
            {" Back"}
          </span>
          <br />

          <ProviderInfo>
            {providerDetails.imageUrl ? (
              <img
                src={providerDetails.imageUrl}
                className="providerImage"
                alt="provider"
              ></img>
            ) : (
              <div>
                {providerDetails.name && (
                  <div
                    style={{
                      backgroundColor: getInitialsAndColorCode(
                        providerDetails.name,
                      )[1],
                      padding: 5,
                      margin: "auto",
                      width: 60,
                      color: "#fff",
                      borderRadius: 2,
                      fontSize: 18,
                      fontWeight: "bold",
                      textAlign: "center",
                      marginRight: 10,
                    }}
                  >
                    <span>
                      {getInitialsAndColorCode(providerDetails.name)[0]}
                    </span>
                  </div>
                )}
              </div>
            )}
            <p className="providerName">{providerDetails.name}</p>
          </ProviderInfo>
        </ProviderInfoTopSection>
        <TemplatesCardsContainer>
          {providerTemplates.length === 0 && !isFetchingProviderTemplates ? (
            <p className="noProvidersMessage">
              No API templates for this provider yet.
            </p>
          ) : (
            <React.Fragment>
              {providerTemplates.map(template => (
                <TemplateCard key={template.templateData.id}>
                  <CardTopContent>
                    <TemplateCardLeftContent>
                      <p className="apiName">{template.templateData.name}</p>
                      <p className="desc">
                        {
                          template.templateData.apiTemplateConfiguration
                            .documentation
                        }
                      </p>
                      <URLContainer>
                        <p className="urlText">
                          <strong>
                            {
                              template.templateData.actionConfiguration
                                .httpMethod
                            }
                          </strong>{" "}
                          <span className="endpoint">
                            {template.templateData.actionConfiguration.path}
                          </span>
                        </p>
                      </URLContainer>
                    </TemplateCardLeftContent>

                    <TemplateCardRightContent className="t--addToPageButtons">
                      {template.addToPageStatus ? (
                        <Button
                          text="Added"
                          intent="none"
                          filled
                          size="small"
                          disabled={true}
                          className="addToPageBtn t--addToPageBtn"
                        />
                      ) : (
                        <Button
                          text="Add to page"
                          intent="primary"
                          filled
                          size="small"
                          onClick={() => this.addApiToPage(template)}
                          disabled={false}
                          loading={template.addToPageLoading}
                          className="addToPageBtn t--addToPageBtn"
                        />
                      )}
                      <Icon
                        icon="chevron-down"
                        iconSize={20}
                        className="dropIcon"
                        onClick={() => {
                          AnalyticsUtil.logEvent("EXPAND_API", {
                            apiName: template.templateData.name,
                          });
                          this.handleIsOpen(template.templateData.id);
                        }}
                      />
                    </TemplateCardRightContent>
                  </CardTopContent>

                  <Collapse
                    isOpen={this.state.toggeledTemplates.includes(
                      template.templateData.id,
                    )}
                    transitionDuration={0}
                  >
                    <ReactJson
                      src={template.templateData.actionConfiguration.headers}
                      style={{
                        marginTop: "12px",
                        fontSize: "14px",
                        padding: "15px",
                        borderTopLeftRadius: "4px",
                        borderTopRightRadius: "4px",
                        width: "90%",
                        wordWrap: "break-word",
                      }}
                      name="Request header"
                      theme="grayscale"
                      displayObjectSize={false}
                      displayDataTypes={false}
                      enableClipboard={false}
                    />
                    {template.templateData.apiTemplateConfiguration
                      .sampleResponse ? (
                      <ReactJson
                        src={
                          template.templateData.apiTemplateConfiguration
                            .sampleResponse
                        }
                        style={{
                          fontSize: "14px",
                          padding: "15px",
                          borderBottomLeftRadius: "4px",
                          borderBottomRightRadius: "4px",
                          maxWidth: "90%",
                          wordWrap: "break-word",
                        }}
                        name="Response Body"
                        theme="grayscale"
                        displayObjectSize={false}
                        displayDataTypes={false}
                        enableClipboard={false}
                      />
                    ) : (
                      <p></p>
                    )}
                  </Collapse>
                </TemplateCard>
              ))}
            </React.Fragment>
          )}
        </TemplatesCardsContainer>
      </TemplateDetailPage>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  providerTemplates: getProviderTemplates(state),
  isFetchingProviderTemplates: getProvidersTemplatesLoadingState(state),
  actions: state.entities.actions,
  providerDetails: state.ui.providers.providerDetailsByProviderId,
});

const mapDispatchToProps = (dispatch: any) => ({
  getProviderDetailsByProviderId: (providerId: string) =>
    dispatch(getProviderDetailsByProviderId(providerId)),

  getProviderTemplates: (providerId: string) =>
    dispatch(fetchProviderTemplates(providerId)),

  setLastUsedEditorPage: (path: string) =>
    dispatch(setLastUsedEditorPage(path)),

  setLastSelectedPage: (selectedPageId: string) =>
    dispatch(setLastSelectedPage(selectedPageId)),

  addApiToPage: (templateData: AddApiToPageRequest) =>
    dispatch(addApiToPage(templateData)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProviderTemplates);
