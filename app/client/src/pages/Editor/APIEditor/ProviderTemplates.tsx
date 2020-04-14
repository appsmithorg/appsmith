import React from "react";
import { connect } from "react-redux";
import { Icon, Collapse } from "@blueprintjs/core";
import { RouteComponentProps } from "react-router-dom";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
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
import ImageAlt from "assets/images/no_image.png";
import { addApiToPage } from "actions/providerActions";
import { Colors } from "constants/Colors";
import { getDuplicateName } from "utils/AppsmithUtils";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import Spinner from "components/editorComponents/Spinner";

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
    padding-left: 15%;
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
  actions: ActionDataState;
  isFetchingProviderTemplates: boolean;
  getProviderTemplates: (providerId: string) => void;
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
    const { providerId } = this.props.match.params;
    this.props.getProviderTemplates(providerId);
  }

  addApiToPage = (templateData: ProviderTemplateArray) => {
    const { destinationPageId } = this.props.match.params;
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
    } = this.props;
    let providerName;
    let providerImage;

    if (this.props.location.state) {
      providerName = new URLSearchParams(this.props.location.state).get(
        "providerName",
      );

      providerImage = new URLSearchParams(this.props.location.state).get(
        "providerImage",
      );
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
            onClick={() => history.goBack()}
          />
          <span className="backBtnText" onClick={() => history.goBack()}>
            {" Back"}
          </span>
          <br />

          <ProviderInfo>
            {providerImage ? (
              <img
                src={providerImage}
                className="providerImage"
                alt="provider"
              ></img>
            ) : (
              <img
                src={ImageAlt}
                className="providerImage"
                alt="provider"
              ></img>
            )}
            <p className="providerName">{providerName}</p>
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

                    <TemplateCardRightContent>
                      {template.addToPageStatus ? (
                        <Button
                          text="Added"
                          intent="none"
                          filled
                          size="small"
                          disabled={true}
                          className="addToPageBtn"
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
                          className="addToPageBtn"
                        />
                      )}
                      <Icon
                        icon="chevron-down"
                        iconSize={20}
                        className="dropIcon"
                        onClick={() =>
                          this.handleIsOpen(template.templateData.id)
                        }
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
});

const mapDispatchToProps = (dispatch: any) => ({
  getProviderTemplates: (providerId: string) =>
    dispatch({
      type: ReduxActionTypes.FETCH_PROVIDER_TEMPLATES_INIT,
      payload: {
        providerId,
      },
    }),
  addApiToPage: (templateData: AddApiToPageRequest) =>
    dispatch(addApiToPage(templateData)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProviderTemplates);
