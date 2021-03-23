import React from "react";
import { formValueSelector, InjectedFormProps, reduxForm } from "redux-form";
import { Spinner, Tag } from "@blueprintjs/core";
import { isString, isArray } from "lodash";
import { Datasource } from "entities/Datasource";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Colors } from "constants/Colors";
import JSONViewer from "./JSONViewer";
import FormControl from "../FormControl";
import Table from "./Table";
import { Action } from "entities/Action";
import { connect, useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
} from "selectors/entitiesSelector";
import { ControlProps } from "components/formControls/BaseControl";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import ActionSettings from "pages/Editor/ActionSettings";
import { addTableWidgetFromQuery } from "actions/widgetActions";
import { OnboardingStep } from "constants/OnboardingConstants";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import log from "loglevel";
import Text, { TextType } from "components/ads/Text";
import { useParams } from "react-router-dom";
import ActionHeader from "pages/common/Actions/ActionHeader";
import styled from "constants/DefaultTheme";
import { TabComponent } from "components/ads/Tabs";
import Icon from "components/ads/Icon";
import { Classes } from "components/ads/common";

const QueryFormContainer = styled.form`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});

  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 15px;
  }

  .statementTextArea {
    font-size: 14px;
    line-height: 20px;
    color: #2e3d49;
    margin-top: 5px;
  }

  .queryInput {
    max-width: 30%;
    padding-right: 10px;
  }

  span.bp3-popover-target {
    display: initial !important;
  }

  .executeOnLoad {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: ${Colors.RED};
  display: inline-block;
  margin-right: 10px;
`;

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const TabbedViewContainer = styled.div`
  .react-tabs__tab-panel {
    overflow: hidden;
  }
  .react-tabs__tab-list {
    margin: 0px;
  }
  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
    }
    .react-tabs__tab-panel {
      height: calc(100% - 36px);
      background-color: ${(props) => props.theme.colors.apiPane.bg};
    }
  }
  position: relative;
  height: 40%;
  border-top: 2px solid #e8e8e8;
`;

const SettingsWrapper = styled.div`
  padding: 5px 30px;
  overflow-y: auto;
`;

const GenerateWidgetButton = styled.a`
  display: flex;
  align-items: center;
  position: absolute;
  right: 30px;
  top: 10px;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  letter-spacing: 0.6px;
  color: #716e6e;

  && {
    margin: 0;
  }

  &:hover {
    text-decoration: none;
    color: #716e6e;
  }
`;

const ResponseWrapper = styled.div`
  height: 60%;
  border-top: 2px solid #e8e8e8;
  position: relative;

  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
    }
    .react-tabs__tab-panel {
      height: calc(100% - 36px);
      background-color: ${(props) => props.theme.colors.apiPane.bg};
    }
  }
`;

const FieldWrapper = styled.div`
  margin-top: 15px;
`;

const DocumentationLink = styled.a`
  position: absolute;
  right: 30px;
  top: 10px;
  color: #a9a7a7;

  && {
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    letter-spacing: -0.24px;
    margin-top: 0;
  }

  &:hover {
    color: #484848;
    text-decoration: none;
  }
`;

const MainConfiguration = styled.div`
  padding: ${(props) => props.theme.spaces[8]}px
    ${(props) => props.theme.spaces[12]}px;
  background-color: ${(props) => props.theme.colors.apiPane.bg};
`;

const HeaderHolder = styled.div`
  display: flex;
  align-items: center;
  min-width: 50%;

  & > div:last-child {
    flex: 1 0 auto;
  }
`;

const HeaderIconHolder = styled.div`
  width: 30px;
  height: 30px;
  background-color: ${(props) => props.theme.colors.queryPaneIconBg};
  overflow: hidden;
  border-radius: 100%;
  margin-right: 6px;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    height: 18px;
    width: 18px;
    display: block;
    object-fit: contain;
  }
`;

const HeaderLabel = styled(Text)`
  margin-left: 12px;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 93px);
`;

const ResponseContentWrapper = styled.div`
  padding: 10px 15px;
  max-height: 455px;
  overflow-y: auto;
`;

const NoResponseContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  .${Classes.ICON} {
    margin-right: 0px;
    svg {
      width: 150px;
      height: 150px;
    }
  }

  .${Classes.TEXT} {
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }
`;

const ErorDescriptionText = styled(Text)`
  width: 500px;
  text-align: center;
  line-height: 25px;
  letter-spacing: -0.195px;
`;

type QueryFormProps = {
  onDeleteClick: () => void;
  onRunClick: () => void;
  isDeleting: boolean;
  isRunning: boolean;
  dataSources: Datasource[];
  DATASOURCES_OPTIONS: any;
  executedQueryData: {
    body: Record<string, any>[] | string;
    isExecutionSuccess: boolean;
  };
  applicationId: string;
  runErrorMessage: string | undefined;
  pageId: string;
  location: {
    state: any;
  };
  editorConfig?: any;
  settingConfig: any;
  loadingFormConfigs: boolean;
};

type ReduxProps = {
  actionName: string;
  responseType: string | undefined;
  pluginId: string;
  documentationLink: string | undefined;
  selectedDbId: string | undefined;
};

export type StateAndRouteProps = QueryFormProps & ReduxProps;

type Props = StateAndRouteProps & InjectedFormProps<Action, StateAndRouteProps>;

const QueryEditorForm: React.FC<Props> = (props: Props) => {
  const params = useParams<{ apiId?: string; queryId?: string }>();

  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );

  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );

  const {
    handleSubmit,
    isRunning,
    onRunClick,
    DATASOURCES_OPTIONS,
    dataSources,
    executedQueryData,
    runErrorMessage,
    responseType,
    documentationLink,
    loadingFormConfigs,
    editorConfig,
    actionName,
  } = props;

  let error = runErrorMessage;
  let output: Record<string, any>[] | null = null;
  let displayMessage = "";

  if (executedQueryData) {
    if (!executedQueryData.isExecutionSuccess) {
      error = String(executedQueryData.body);
    } else if (isString(executedQueryData.body)) {
      output = JSON.parse(executedQueryData.body);
    } else {
      output = executedQueryData.body;
    }
  }

  // Constructing the header of the response based on the response
  if (!output) {
    displayMessage = "No data records to display";
  } else if (isArray(output)) {
    // The returned output is an array
    displayMessage = output.length ? "Response" : "No data records to display";
  } else {
    // Output is a JSON object. We can display a single object
    displayMessage = "Query response";
  }

  const isTableResponse = responseType === "TABLE";

  const dispatch = useDispatch();
  const onAddWidget = () => {
    dispatch(addTableWidgetFromQuery(actionName));
  };

  if (loadingFormConfigs) {
    return (
      <LoadingContainer>
        <Spinner size={30} />
      </LoadingContainer>
    );
  }

  const selectedDb = DATASOURCES_OPTIONS.filter((data: any) => {
    return data.value === props.selectedDbId;
  });

  return (
    <QueryFormContainer onSubmit={handleSubmit}>
      <MainConfiguration>
        <ActionHeader
          isLoading={isRunning}
          currentActionConfigId={
            currentActionConfig ? currentActionConfig.id : ""
          }
          currentActionConfigName={
            currentActionConfig ? currentActionConfig.name : ""
          }
          onRunClick={onRunClick}
          actionTitle={
            <HeaderHolder>
              <HeaderIconHolder>
                {selectedDb.length ? (
                  <img
                    className="plugin-image"
                    src={selectedDb[0].image}
                    alt="Datasource"
                  />
                ) : null}
              </HeaderIconHolder>
              <div>
                <ActionNameEditor page="API_PANE" />
                {selectedDb.length ? (
                  <HeaderLabel type={TextType.P3} style={{ color: "#4B4848" }}>
                    {selectedDb[0].label}
                  </HeaderLabel>
                ) : null}
              </div>
            </HeaderHolder>
          }
          runButtonClassName="t--run-query"
        />
      </MainConfiguration>
      <SecondaryWrapper>
        <TabbedViewContainer>
          {documentationLink && (
            <DocumentationLink
              href={documentationLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </DocumentationLink>
          )}

          <TabComponent
            tabs={[
              {
                key: "query",
                title: "Query",
                panelComponent: (
                  <SettingsWrapper>
                    {editorConfig && editorConfig.length > 0 ? (
                      editorConfig.map(renderEachConfig)
                    ) : (
                      <>
                        <ErrorMessage>
                          An unexpected error occurred
                        </ErrorMessage>
                        <Tag
                          round
                          intent="warning"
                          interactive
                          minimal
                          onClick={() => window.location.reload()}
                        >
                          Refresh
                        </Tag>
                      </>
                    )}
                  </SettingsWrapper>
                ),
              },
              {
                key: "settings",
                title: "Settings",
                panelComponent: (
                  <SettingsWrapper>
                    <ActionSettings
                      actionSettingsConfig={props.settingConfig}
                      formName={QUERY_EDITOR_FORM_NAME}
                    />
                  </SettingsWrapper>
                ),
              },
            ]}
          />
        </TabbedViewContainer>

        <ResponseWrapper>
          {output && !!output.length && (
            <Boxed step={OnboardingStep.SUCCESSFUL_BINDING}>
              <GenerateWidgetButton
                className="t--add-widget"
                onClick={onAddWidget}
              >
                <Icon name="plus" />
                &nbsp;&nbsp;Generate Widget
              </GenerateWidgetButton>
            </Boxed>
          )}

          <TabComponent
            tabs={[
              {
                key: `${displayMessage}`,
                title: `${displayMessage}`,
                panelComponent: (
                  <>
                    {output && (
                      <ResponseContentWrapper>
                        {error ? (
                          <NoResponseContainer>
                            <Icon name="invalid-datasource" />
                            <Text
                              type={TextType.H3}
                              style={{ color: "#F22B2B" }}
                            >
                              Datasource is invalid
                            </Text>
                            <ErorDescriptionText type={TextType.P1}>
                              Please edit to make it valid. Details: Missing
                              endpoint, Missing username for authentication,
                              Missing password for authentication.
                            </ErorDescriptionText>
                          </NoResponseContainer>
                        ) : dataSources.length === 0 ? (
                          <NoResponseContainer>
                            <Icon name="no-response" />
                            <Text type={TextType.P1}>
                              Hit Run to get a Response
                            </Text>
                          </NoResponseContainer>
                        ) : isTableResponse ? (
                          <Table data={output} />
                        ) : (
                          <JSONViewer src={output} />
                        )}
                      </ResponseContentWrapper>
                    )}
                  </>
                ),
              },
            ]}
          />
        </ResponseWrapper>
      </SecondaryWrapper>
    </QueryFormContainer>
  );
};

const renderEachConfig = (section: any): any => {
  return section.children.map((formControlOrSection: ControlProps) => {
    if ("children" in formControlOrSection) {
      return renderEachConfig(formControlOrSection);
    } else {
      try {
        const { configProperty } = formControlOrSection;
        return (
          <FieldWrapper key={configProperty}>
            <FormControl
              config={formControlOrSection}
              formName={QUERY_EDITOR_FORM_NAME}
            />
          </FieldWrapper>
        );
      } catch (e) {
        log.error(e);
      }
    }
    return null;
  });
};

const valueSelector = formValueSelector(QUERY_EDITOR_FORM_NAME);
const mapStateToProps = (state: AppState) => {
  const actionName = valueSelector(state, "name");
  const pluginId = valueSelector(state, "datasource.pluginId");
  const selectedDbId = valueSelector(state, "datasource.id");

  const responseTypes = getPluginResponseTypes(state);
  const documentationLinks = getPluginDocumentationLinks(state);

  return {
    actionName,
    pluginId,
    selectedDbId,
    responseType: responseTypes[pluginId],
    documentationLink: documentationLinks[pluginId],
  };
};

export default connect(mapStateToProps)(
  reduxForm<Action, StateAndRouteProps>({
    form: QUERY_EDITOR_FORM_NAME,
    enableReinitialize: true,
  })(QueryEditorForm),
);
