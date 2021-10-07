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
import { getDuplicateName } from "utils/AppsmithUtils";
import { INTEGRATION_EDITOR_URL, INTEGRATION_TABS } from "constants/routes";
import Spinner from "components/editorComponents/Spinner";
import { getInitialsAndColorCode } from "utils/AppsmithUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppCardColorPalette } from "selectors/themeSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const TEMPLATES_TOP_SECTION_HEIGHT = "83px";

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
      ${(props) => props.theme.headerHeight}
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
    display: flex;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 98%;
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
  appCardColors: string[];
  applicationId: string;
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
      .filter((a) => a.config.pageId === destinationPageId)
      .map((a) => a.config.name);
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
      applicationId,
      history,
      isFetchingProviderTemplates,
      providerDetails,
      providerTemplates,
    } = this.props;
    const { pageId } = this.props.match.params;

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
          {/* <SearchContainer>
            <SearchBar
              icon="search"
              input={{
                onChange: this.handleSearchChange,
              }}
              placeholder="Search"
            />
          </SearchContainer> */}

          <Icon
            className="backBtn"
            icon="chevron-left"
            iconSize={16}
            onClick={() =>
              history.push(
                INTEGRATION_EDITOR_URL(
                  applicationId,
                  pageId,
                  INTEGRATION_TABS.ACTIVE,
                ),
              )
            }
          />
          <span
            className="backBtnText"
            onClick={() =>
              history.push(
                INTEGRATION_EDITOR_URL(
                  applicationId,
                  pageId,
                  INTEGRATION_TABS.ACTIVE,
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
                alt="provider"
                className="providerImage"
                src={providerDetails.imageUrl}
              />
            ) : (
              <div>
                {providerDetails.name && (
                  <div
                    style={{
                      backgroundColor: getInitialsAndColorCode(
                        providerDetails.name,
                        this.props.appCardColors,
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
                      {
                        getInitialsAndColorCode(
                          providerDetails.name,
                          this.props.appCardColors,
                        )[0]
                      }
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
            <>
              {providerTemplates.map((template) => (
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
                          <span
                            className="endpoint"
                            title={
                              template.templateData.actionConfiguration.path
                            }
                          >
                            {template.templateData.actionConfiguration.path}
                          </span>
                        </p>
                      </URLContainer>
                    </TemplateCardLeftContent>

                    <TemplateCardRightContent className="t--addToPageButtons">
                      {template.addToPageStatus ? (
                        <Button
                          className="addToPageBtn t--addToPageBtn"
                          disabled
                          filled
                          intent="none"
                          size="small"
                          text="Added"
                        />
                      ) : (
                        <Button
                          className="addToPageBtn t--addToPageBtn"
                          disabled={false}
                          filled
                          intent="primary"
                          loading={template.addToPageLoading}
                          onClick={() => this.addApiToPage(template)}
                          size="small"
                          text="Add to page"
                        />
                      )}
                      <Icon
                        className="dropIcon"
                        icon="chevron-down"
                        iconSize={20}
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
                      displayDataTypes={false}
                      displayObjectSize={false}
                      enableClipboard={false}
                      name="Request header"
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
                      theme="grayscale"
                    />
                    {template.templateData.apiTemplateConfiguration
                      .sampleResponse ? (
                      <ReactJson
                        displayDataTypes={false}
                        displayObjectSize={false}
                        enableClipboard={false}
                        name="Response Body"
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
                        theme="grayscale"
                      />
                    ) : (
                      <p />
                    )}
                  </Collapse>
                </TemplateCard>
              ))}
            </>
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
  appCardColors: getAppCardColorPalette(state),
  applicationId: getCurrentApplicationId(state),
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
