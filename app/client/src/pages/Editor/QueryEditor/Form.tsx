import React, { RefObject, useRef, useState } from "react";
import { formValueSelector, InjectedFormProps, reduxForm } from "redux-form";
import { Icon, Tag } from "@blueprintjs/core";
import { isString } from "lodash";
import {
  components,
  MenuListComponentProps,
  OptionProps,
  OptionTypeBase,
  SingleValueProps,
} from "react-select";
import { Datasource } from "entities/Datasource";
import { BaseTabbedView } from "components/designSystems/appsmith/TabbedView";
import { QUERY_EDITOR_FORM_NAME } from "constants/forms";
import { Colors } from "constants/Colors";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import JSONViewer from "./JSONViewer";
import FormControl from "../FormControl";
import Table from "./Table";
import { Action } from "entities/Action";
import { connect, useDispatch } from "react-redux";
import { AppState } from "reducers";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import {
  getPluginResponseTypes,
  getPluginDocumentationLinks,
} from "selectors/entitiesSelector";
import { ControlProps } from "components/formControls/BaseControl";
import ActionSettings from "pages/Editor/ActionSettings";
import { addTableWidgetFromQuery } from "actions/widgetActions";
import { OnboardingStep } from "constants/OnboardingConstants";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import log from "loglevel";
import Text, { TextType } from "components/ads/Text";
import styled from "constants/DefaultTheme";
import { TabComponent } from "components/ads/Tabs";
import AdsIcon from "components/ads/Icon";
import { Classes } from "components/ads/common";
import FormRow from "components/editorComponents/FormRow";
import history from "utils/history";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import Button from "components/editorComponents/Button";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import Resizable, {
  ResizerCSS,
} from "components/editorComponents/Debugger/Resizer";
import DebuggerMessage from "components/editorComponents/Debugger/DebuggerMessage";

const QueryFormContainer = styled.form`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 0px 0px 0px;
  width: 100%;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
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

const TabbedViewContainer = styled.div`
  ${ResizerCSS}
  flex: 1;
  // Initial height of bottom tabs
  height: 40%;
  // Minimum height of bottom tabs as it can be resized
  min-height: 40%;
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
    }
  }
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};
  border-top: 2px solid #e8e8e8;
`;

const SettingsWrapper = styled.div`
  padding: 5px 30px;
  overflow-y: auto;
  height: 100%;
`;

const GenerateWidgetButton = styled.a`
  display: flex;
  align-items: center;
  position: absolute;
  right: 30px;
  top: 8px;
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

const FieldWrapper = styled.div`
  margin-top: 15px;
`;

const DocumentationLink = styled.a`
  position: absolute;
  right: 23px;
  top: -6px;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px);
`;

const ResponseContentWrapper = styled.div`
  padding: 10px 15px;
  overflow-y: auto;
  height: 100%;
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

const ErrorContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  padding-top: 10px;
  flex-direction: column;
  & > .${Classes.ICON} {
    margin-right: 0px;
    svg {
      width: 75px;
      height: 75px;
    }
  }
  .${Classes.TEXT} {
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }
`;

const ErrorDescriptionText = styled(Text)`
  width: 500px;
  text-align: center;
  line-height: 25px;
  letter-spacing: -0.195px;
`;

const StyledFormRow = styled(FormRow)`
  padding: 0px 24px;
  flex: 0;
`;

const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 50%;
  justify-content: flex-end;
`;

const DropdownSelect = styled.div`
  font-size: 14px;
  margin-right: 10px;
`;

const CreateDatasource = styled.div`
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-top: 1px solid ${Colors.ATHENS_GRAY};
  :hover {
    cursor: pointer;
  }
  .createIcon {
    margin-right: 6px;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  .plugin-image {
    height: 20px;
    width: auto;
  }
  .selected-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: no-wrap;
    margin-left: 6px;
  }
`;

const ActionButton = styled(BaseButton)`
  &&&& {
    min-width: 72px;
    width: auto;
    margin: 0 5px;
    min-height: 30px;
  }
`;

const NoDataSourceContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-top: 62px;
  flex: 1;
  .font18 {
    width: 50%;
    text-align: center;
    margin-bottom: 23px;
    font-size: 18px;
    color: #2e3d49;
  }
`;

const StyledOpenDocsIcon = styled(Icon)`
  svg {
    width: 12px;
    height: 18px;
  }
`;

const TabContainerView = styled.div`
  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 15px;
  }
  .react-tabs__tab-panel {
    overflow: scroll;
  }
  .react-tabs__tab-list {
    margin: 0px;
  }
  &&& {
    ul.react-tabs__tab-list {
      padding-left: 23px;
    }
  }
  position: relative;
  height: 50%;
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
  const {
    handleSubmit,
    isRunning,
    isDeleting,
    onRunClick,
    onDeleteClick,
    DATASOURCES_OPTIONS,
    dataSources,
    pageId,
    executedQueryData,
    runErrorMessage,
    responseType,
    documentationLink,
    applicationId,
    editorConfig,
    actionName,
  } = props;

  let error = runErrorMessage;
  let output: Record<string, any>[] | null = null;
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (executedQueryData) {
    if (!executedQueryData.isExecutionSuccess) {
      error = String(executedQueryData.body);
    } else if (isString(executedQueryData.body)) {
      output = JSON.parse(executedQueryData.body);
    } else {
      output = executedQueryData.body;
    }
  }

  const isTableResponse = responseType === "TABLE";

  const dispatch = useDispatch();
  const onAddWidget = () => {
    dispatch(addTableWidgetFromQuery(actionName));
  };

  const MenuList = (props: MenuListComponentProps<{ children: Node }>) => {
    return (
      <>
        <components.MenuList {...props}>{props.children}</components.MenuList>
        <CreateDatasource
          onClick={() => {
            history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
          }}
        >
          <Icon icon="plus" iconSize={11} className="createIcon" />
          Create new datasource
        </CreateDatasource>
      </>
    );
  };

  const SingleValue = (props: SingleValueProps<OptionTypeBase>) => {
    return (
      <>
        <components.SingleValue {...props}>
          <Container>
            <img
              className="plugin-image"
              src={props.data.image}
              alt="Datasource"
            />
            <div className="selected-value">{props.children}</div>
          </Container>
        </components.SingleValue>
      </>
    );
  };

  const CustomOption = (props: OptionProps<OptionTypeBase>) => {
    return (
      <>
        <components.Option {...props}>
          <Container className="t--datasource-option">
            <img
              className="plugin-image"
              src={props.data.image}
              alt="Datasource"
            />
            <div style={{ marginLeft: "6px" }}>{props.children}</div>
          </Container>
        </components.Option>
      </>
    );
  };

  return (
    <QueryFormContainer onSubmit={handleSubmit}>
      <StyledFormRow>
        <NameWrapper>
          <ActionNameEditor />
        </NameWrapper>
        <ActionsWrapper>
          <DropdownSelect>
            <DropdownField
              className={"t--switch-datasource"}
              placeholder="Datasource"
              name="datasource.id"
              options={DATASOURCES_OPTIONS}
              width={232}
              maxMenuHeight={200}
              components={{ MenuList, Option: CustomOption, SingleValue }}
            />
          </DropdownSelect>
          <ActionButton
            className="t--delete-query"
            text="Delete"
            accent="error"
            loading={isDeleting}
            onClick={onDeleteClick}
          />

          <OnboardingIndicator
            step={OnboardingStep.EXAMPLE_DATABASE}
            width={75}
          >
            <ActionButton
              className="t--run-query"
              text="Run"
              filled
              loading={isRunning}
              accent="primary"
              onClick={onRunClick}
            />
          </OnboardingIndicator>
        </ActionsWrapper>
      </StyledFormRow>
      <SecondaryWrapper>
        <TabContainerView>
          {documentationLink && (
            <DocumentationLink
              href={documentationLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {"Documentation "}
              <StyledOpenDocsIcon icon="document-open" />
            </DocumentationLink>
          )}

          <BaseTabbedView
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
                    {dataSources.length === 0 && (
                      <NoDataSourceContainer>
                        <p className="font18">
                          Seems like you don’t have any Datasources to create a
                          query
                        </p>
                        <Button
                          onClick={() =>
                            history.push(
                              DATA_SOURCES_EDITOR_URL(applicationId, pageId),
                            )
                          }
                          text="Add a Datasource"
                          intent="primary"
                          filled
                          size="small"
                          icon="plus"
                        />
                      </NoDataSourceContainer>
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
        </TabContainerView>

        <TabbedViewContainer ref={panelRef}>
          <Resizable panelRef={panelRef} />
          {output && !!output.length && (
            <Boxed step={OnboardingStep.SUCCESSFUL_BINDING}>
              <GenerateWidgetButton
                className="t--add-widget"
                onClick={onAddWidget}
              >
                <AdsIcon name="plus" />
                &nbsp;&nbsp;Generate Widget
              </GenerateWidgetButton>
            </Boxed>
          )}

          <TabComponent
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            tabs={[
              {
                key: "Response",
                title: "Response",
                panelComponent: (
                  <ResponseContentWrapper>
                    {error && (
                      <ErrorContainer>
                        <AdsIcon name="error" />
                        <Text type={TextType.H3} style={{ color: "#F22B2B" }}>
                          An error occurred
                        </Text>

                        <ErrorDescriptionText type={TextType.P1}>
                          {error}
                        </ErrorDescriptionText>
                        <DebuggerMessage onClick={() => setSelectedIndex(1)} />
                      </ErrorContainer>
                    )}
                    {output && (
                      <>
                        {isTableResponse ? (
                          <Table data={output} />
                        ) : (
                          <JSONViewer src={output} />
                        )}
                      </>
                    )}
                    {!output && !error && (
                      <NoResponseContainer>
                        <AdsIcon name="no-response" />
                        <Text type={TextType.P1}>
                          Hit Run to get a Response
                        </Text>
                      </NoResponseContainer>
                    )}
                  </ResponseContentWrapper>
                ),
              },
              {
                key: "error-logs",
                title: "Errors",
                panelComponent: <ErrorLogs />,
              },
              {
                key: "logs",
                title: "Logs",
                panelComponent: <DebuggerLogs searchQuery={actionName} />,
              },
            ]}
          />
        </TabbedViewContainer>
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
