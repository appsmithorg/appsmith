import React, { RefObject, useRef, useState } from "react";
import { InjectedFormProps } from "redux-form";
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
import { Colors } from "constants/Colors";
import JSONViewer from "./JSONViewer";
import FormControl from "../FormControl";
import Table from "./Table";
import { Action, QueryAction, SaaSAction } from "entities/Action";
import { useDispatch, useSelector } from "react-redux";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import { ControlProps } from "components/formControls/BaseControl";
import ActionSettings from "pages/Editor/ActionSettings";
import log from "loglevel";
import Callout from "components/ads/Callout";
import { Variant } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import styled from "constants/DefaultTheme";
import { TabComponent } from "components/ads/Tabs";
import AdsIcon, { IconSize } from "components/ads/Icon";
import { Classes } from "components/ads/common";
import FormRow from "components/editorComponents/FormRow";
import EditorButton from "components/editorComponents/Button";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import Resizable, {
  ResizerCSS,
} from "components/editorComponents/Debugger/Resizer";
import DebuggerMessage from "components/editorComponents/Debugger/DebuggerMessage";
import AnalyticsUtil from "utils/AnalyticsUtil";
import CloseEditor from "components/editorComponents/CloseEditor";
import { setGlobalSearchQuery } from "actions/globalSearchActions";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import EntityDeps from "components/editorComponents/Debugger/EntityDependecies";
import { isHidden } from "components/formControls/utils";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  DEBUGGER_QUERY_RESPONSE_SECOND_HALF,
  DOCUMENTATION,
  DOCUMENTATION_TOOLTIP,
  INSPECT_ENTITY,
} from "@appsmith/constants/messages";
import { useParams } from "react-router";
import { AppState } from "reducers";
import { ExplorerURLParams } from "../Explorer/helpers";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import Button, { Size } from "components/ads/Button";
import { thinScrollbar } from "constants/DefaultTheme";
import ActionRightPane, {
  useEntityDependencies,
} from "components/editorComponents/ActionRightPane";
import { SuggestedWidget } from "api/ActionAPI";
import { Plugin } from "api/PluginApi";
import { UIComponentTypes } from "../../../api/PluginApi";
import TooltipComponent from "components/ads/Tooltip";
import * as Sentry from "@sentry/react";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import SearchSnippets from "components/ads/SnippetButton";
import EntityBottomTabs from "components/editorComponents/EntityBottomTabs";
import { setCurrentTab } from "actions/debuggerActions";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import { getErrorAsString } from "sagas/ActionExecution/errorUtils";
import Guide from "pages/Editor/GuidedTour/Guide";
import Boxed from "pages/Editor/GuidedTour/Boxed";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { EDITOR_TABS } from "constants/QueryEditorConstants";
import { GUIDED_TOUR_STEPS } from "../GuidedTour/constants";
import Spinner from "components/ads/Spinner";
import {
  ConditionalOutput,
  FormEvalOutput,
  DynamicValues,
} from "reducers/evaluationReducers/formEvaluationReducer";

const QueryFormContainer = styled.form`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 0px 0px 0px;
  width: 100%;
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

export const TabbedViewContainer = styled.div`
  ${ResizerCSS}
  height: ${(props) => props.theme.actionsBottomTabInitialHeight};
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  width: 100%;
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
  padding: 16px 30px;
  height: 100%;
  ${thinScrollbar};
`;

const ResultsCount = styled.div`
  position: absolute;
  right: 13px;
  top: 8px;
  color: #716e6e;
`;

const FieldWrapper = styled.div`
  margin-top: 15px;
`;

const DocumentationLink = styled.a`
  position: absolute;
  right: 23px;
  top: -6px;
  color: black;
  display: flex;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  span {
    display: flex;
    margin-left: 5px;
  }
  &:hover {
    color: black;
  }
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const HelpSection = styled.div``;

const ResponseContentWrapper = styled.div`
  padding: 10px 15px;
  overflow-y: auto;
  height: 100%;

  ${HelpSection} {
    margin-bottom: 10px;
  }
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
  flex: 1;
  align-items: center;
  justify-content: center;
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

export const StyledFormRow = styled(FormRow)`
  padding: 0px 20px;
  flex: 0;
`;

const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

  & > div {
    margin: 0 0 0 ${(props) => props.theme.spaces[7]}px;
  }

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }
`;

const DropdownSelect = styled.div`
  font-size: 14px;
  margin-right: 10px;

  .t--switch-datasource > div {
    min-height: 30px;
    height: 30px;

    & > div {
      height: 100%;
    }
  }
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

const StyledSpinner = styled.div`
  display: flex;
  padding: 5px;
  height: 2vw;
  align-items: center;
  justify-content: space-between;
  width: 5vw;
`;

// const ActionButton = styled(BaseButton)`
//   &&&& {
//     min-width: 72px;
//     width: auto;
//     margin: 0 5px;
//     min-height: 30px;
//   }
// `;

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

const TabContainerView = styled.div`
  flex: 1;
  overflow: auto;
  border-top: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  ${thinScrollbar}
  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 12px;
  }
  .react-tabs__tab-panel {
    overflow: auto;
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
`;

const InlineButton = styled(Button)`
  display: inline-flex;
  margin: 0 4px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 50px);
  width: 100%;
`;

const SidebarWrapper = styled.div<{ show: boolean }>`
  border: 1px solid #e8e8e8;
  display: ${(props) => (props.show ? "flex" : "none")};
  width: ${(props) => props.theme.actionSidePane.width}px;
`;

type QueryFormProps = {
  onDeleteClick: () => void;
  onRunClick: () => void;
  onCreateDatasourceClick: () => void;
  isDeleting: boolean;
  isRunning: boolean;
  dataSources: Datasource[];
  DATASOURCES_OPTIONS: any;
  uiComponent: UIComponentTypes;
  executedQueryData?: {
    body: any;
    isExecutionSuccess?: boolean;
    messages?: Array<string>;
    suggestedWidgets?: SuggestedWidget[];
    readableError?: string;
  };
  runErrorMessage: string | undefined;
  location: {
    state: any;
  };
  editorConfig?: any;
  formName: string;
  settingConfig: any;
  formData: SaaSAction | QueryAction;
};

type ReduxProps = {
  actionName: string;
  responseType: string | undefined;
  plugin?: Plugin;
  pluginId: string;
  documentationLink: string | undefined;
  formEvaluationState: FormEvalOutput;
};

export type EditorJSONtoFormProps = QueryFormProps & ReduxProps;

type Props = EditorJSONtoFormProps &
  InjectedFormProps<Action, EditorJSONtoFormProps>;

export function EditorJSONtoForm(props: Props) {
  const {
    actionName,
    dataSources,
    DATASOURCES_OPTIONS,
    documentationLink,
    editorConfig,
    executedQueryData,
    formName,
    handleSubmit,
    isRunning,
    onCreateDatasourceClick,
    onRunClick,
    plugin,
    responseType,
    runErrorMessage,
    settingConfig,
    uiComponent,
  } = props;
  let error = runErrorMessage;
  let output: Record<string, any>[] | null = null;
  let hintMessages: Array<string> = [];
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const [tableBodyHeight, setTableBodyHeightHeight] = useState(
    window.innerHeight,
  );

  const params = useParams<{ apiId?: string; queryId?: string }>();

  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const guidedTourEnabled = useSelector(inGuidedTour);
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );
  const { pageId } = useParams<ExplorerURLParams>();

  // Query is executed even once during the session, show the response data.
  if (executedQueryData) {
    if (!executedQueryData.isExecutionSuccess) {
      // Pass the error to be shown in the error tab
      error = executedQueryData.readableError
        ? getErrorAsString(executedQueryData.readableError)
        : getErrorAsString(executedQueryData.body);
    } else if (isString(executedQueryData.body)) {
      try {
        // Try to parse response as JSON array to be displayed in the Response tab
        output = JSON.parse(executedQueryData.body);
      } catch (e) {
        // In case the string is not a JSON, wrap it in a response object
        output = [
          {
            response: executedQueryData.body,
          },
        ];
      }
    } else {
      output = executedQueryData.body;
    }
    if (executedQueryData.messages && executedQueryData.messages.length) {
      hintMessages = executedQueryData.messages;
    }
  }

  const isTableResponse = responseType === "TABLE";

  const dispatch = useDispatch();

  function MenuList(props: MenuListComponentProps<{ children: Node }>) {
    return (
      <>
        <components.MenuList {...props}>{props.children}</components.MenuList>
        <CreateDatasource onClick={() => onCreateDatasourceClick()}>
          <Icon className="createIcon" icon="plus" iconSize={11} />
          Create new datasource
        </CreateDatasource>
      </>
    );
  }

  function SingleValue(props: SingleValueProps<OptionTypeBase>) {
    return (
      <components.SingleValue {...props}>
        <Container>
          <img
            alt="Datasource"
            className="plugin-image"
            src={props.data.image}
          />
          <div className="selected-value">{props.children}</div>
        </Container>
      </components.SingleValue>
    );
  }

  function CustomOption(props: OptionProps<OptionTypeBase>) {
    return (
      <components.Option {...props}>
        <Container className="t--datasource-option">
          <img
            alt="Datasource"
            className="plugin-image"
            src={props.data.image}
          />
          <div style={{ marginLeft: "6px" }}>{props.children}</div>
        </Container>
      </components.Option>
    );
  }

  const handleDocumentationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const query = plugin?.name || "Connecting to datasources";
    dispatch(setGlobalSearchQuery(query));
    dispatch(toggleShowGlobalSearchModal());
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "DATASOURCE_DOCUMENTATION_CLICK",
      query,
    });
  };

  // Added function to handle the render of the configs
  const renderConfig = (editorConfig: any) => {
    try {
      // Selectively rendering form based on uiComponent prop
      if (uiComponent === UIComponentTypes.UQIDbEditorForm) {
        // If the formEvaluation is not ready yet, just show loading state.
        if (
          props.hasOwnProperty("formEvaluationState") &&
          !!props.formEvaluationState &&
          Object.keys(props.formEvaluationState).length > 0
        ) {
          return editorConfig.map((config: any, idx: number) => {
            return renderEachConfigV2(formName, config, idx);
          });
        } else {
          return (
            <StyledSpinner>
              <Spinner size={IconSize.LARGE} />
              <p>Loading..</p>
            </StyledSpinner>
          );
        }
      } else {
        return editorConfig.map(renderEachConfig(formName));
      }
    } catch (e) {
      log.error(e);
      Sentry.captureException(e);
      return (
        <>
          <ErrorMessage>Invalid form configuration</ErrorMessage>
          <Tag
            intent="warning"
            interactive
            minimal
            onClick={() => window.location.reload()}
            round
          >
            Refresh
          </Tag>
        </>
      );
    }
  };

  const extractConditionalOutput = (section: any): ConditionalOutput => {
    let conditionalOutput: ConditionalOutput = {};
    if (
      section.hasOwnProperty("propertyName") &&
      props.formEvaluationState.hasOwnProperty(section.propertyName)
    ) {
      conditionalOutput = props?.formEvaluationState[section.propertyName];
    } else if (
      section.hasOwnProperty("configProperty") &&
      props.formEvaluationState.hasOwnProperty(section.configProperty)
    ) {
      conditionalOutput = props?.formEvaluationState[section.configProperty];
    } else if (
      section.hasOwnProperty("identifier") &&
      !!section.identifier &&
      props.formEvaluationState.hasOwnProperty(section.identifier)
    ) {
      conditionalOutput = props?.formEvaluationState[section.identifier];
    }
    return conditionalOutput;
  };

  // Function to check if the section config is allowed to render (Only for UQI forms)
  const checkIfSectionCanRender = (conditionalOutput: ConditionalOutput) => {
    // By default, allow the section to render. This is to allow for the case where no conditional is provided.
    // The evaluation state disallows the section to render if the condition is not met. (Checkout formEval.ts)
    let allowToRender = true;
    if (
      conditionalOutput.hasOwnProperty("visible") &&
      typeof conditionalOutput.visible === "boolean"
    ) {
      allowToRender = conditionalOutput.visible;
    }
    return allowToRender;
  };

  // Function to check if the section config is enabled (Only for UQI forms)
  const checkIfSectionIsEnabled = (conditionalOutput: ConditionalOutput) => {
    // By default, the section is enabled. This is to allow for the case where no conditional is provided.
    // The evaluation state disables the section if the condition is not met. (Checkout formEval.ts)
    let enabled = true;
    if (
      conditionalOutput.hasOwnProperty("enabled") &&
      typeof conditionalOutput.enabled === "boolean"
    ) {
      enabled = conditionalOutput.enabled;
    }
    return enabled;
  };

  // Function to modify the section config based on the output of evaluations
  const modifySectionConfig = (
    section: any,
    enabled: boolean,
    dynamicFetchedValues: DynamicValues | undefined,
  ): any => {
    if (!enabled) {
      section.disabled = true;
    } else {
      section.disabled = false;
    }
    if (!!dynamicFetchedValues) {
      section.dynamicFetchedValues = dynamicFetchedValues;
    }

    return section;
  };

  // Function to extract the object for dynamicValues if it is there in the evaluation state
  const extractDynamicValuesIfPresent = (
    conditionalOutput: ConditionalOutput,
  ) => {
    // By default, the section is enabled. This is to allow for the case where no conditional is provided.
    // The evaluation state disables the section if the condition is not met. (Checkout formEval.ts)
    let dynamicFetchedValues: DynamicValues | undefined;
    if (conditionalOutput.hasOwnProperty("fetchDynamicValues")) {
      dynamicFetchedValues = conditionalOutput.fetchDynamicValues;
    }
    return dynamicFetchedValues;
  };

  // Render function to render the V2 of form editor type (UQI)
  // Section argument is a nested config object, this function recursively renders the UI based on the config
  const renderEachConfigV2 = (formName: string, section: any, idx: number) => {
    let enabled = true;
    let dynamicFetchedValues: DynamicValues | undefined;
    if (!!section) {
      if ("schema" in section && section.schema.length > 0) {
        section.schema.forEach((subSection: any, index: number) => {
          const configPropertyOfSubSection = `${
            section.configProperty
          }.column_${index + 1}`;
          const conditionalOutput = extractConditionalOutput({
            ...subSection,
            configProperty: configPropertyOfSubSection,
          });
          enabled = checkIfSectionIsEnabled(conditionalOutput);
          dynamicFetchedValues = extractDynamicValuesIfPresent(
            conditionalOutput,
          );
          subSection = modifySectionConfig(
            subSection,
            enabled,
            dynamicFetchedValues,
          );
        });
      }
      // If the component is not allowed to render, return null
      const conditionalOutput = extractConditionalOutput(section);
      if (!checkIfSectionCanRender(conditionalOutput)) return null;
      enabled = checkIfSectionIsEnabled(conditionalOutput);
      dynamicFetchedValues = extractDynamicValuesIfPresent(conditionalOutput);
    }
    if (section.hasOwnProperty("controlType")) {
      // If component is type section, render it's children
      if (
        section.controlType === "SECTION" &&
        section.hasOwnProperty("children")
      ) {
        return section.children.map((section: any, idx: number) => {
          return renderEachConfigV2(formName, section, idx);
        });
      }
      try {
        const { configProperty } = section;
        const modifiedSection = modifySectionConfig(
          section,
          enabled,
          dynamicFetchedValues,
        );
        return (
          <FieldWrapper key={`${configProperty}_${idx}`}>
            <FormControl config={modifiedSection} formName={formName} />
          </FieldWrapper>
        );
      } catch (e) {
        log.error(e);
      }
    } else {
      return section.map((section: any, idx: number) => {
        renderEachConfigV2(formName, section, idx);
      });
    }
    return null;
  };

  // Recursive call to render forms pre UQI
  const renderEachConfig = (formName: string) => (section: any): any => {
    return section.children.map(
      (formControlOrSection: ControlProps, idx: number) => {
        if (isHidden(props.formData, section.hidden)) return null;
        if (formControlOrSection.hasOwnProperty("children")) {
          return renderEachConfig(formName)(formControlOrSection);
        } else {
          try {
            const { configProperty } = formControlOrSection;
            return (
              <FieldWrapper key={`${configProperty}_${idx}`}>
                <FormControl
                  config={formControlOrSection}
                  formName={formName}
                />
              </FieldWrapper>
            );
          } catch (e) {
            log.error(e);
          }
        }
        return null;
      },
    );
  };

  const responeTabOnRunClick = () => {
    props.onRunClick();

    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "QUERY_PANE",
    });
  };

  const responseTabs = [
    {
      key: "Response",
      title: "Response",
      panelComponent: (
        <ResponseContentWrapper>
          {error && (
            <ErrorContainer>
              <AdsIcon keepColors name="warning-triangle" />
              <Text style={{ color: "#F22B2B" }} type={TextType.H3}>
                An error occurred
              </Text>

              <ErrorDescriptionText
                className="t--query-error"
                type={TextType.P1}
              >
                {error}
              </ErrorDescriptionText>
              <DebuggerMessage
                onClick={() => {
                  AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
                    source: "QUERY",
                  });
                  dispatch(setCurrentTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
                }}
                secondHalfText={createMessage(
                  DEBUGGER_QUERY_RESPONSE_SECOND_HALF,
                )}
              />
            </ErrorContainer>
          )}
          {hintMessages && hintMessages.length > 0 && (
            <HelpSection>
              {hintMessages.map((msg, index) => (
                <Callout
                  fill
                  key={index}
                  text={msg}
                  variant={Variant.warning}
                />
              ))}
            </HelpSection>
          )}
          {output &&
            (isTableResponse ? (
              <Table data={output} tableBodyHeight={tableBodyHeight} />
            ) : (
              <JSONViewer src={output} />
            ))}
          {!output && !error && (
            <NoResponseContainer>
              <AdsIcon name="no-response" />
              <Text type={TextType.P1}>
                🙌 Click on
                <InlineButton
                  isLoading={isRunning}
                  onClick={responeTabOnRunClick}
                  size={Size.medium}
                  tag="button"
                  text="Run"
                  type="button"
                />
                after adding your query
              </Text>
            </NoResponseContainer>
          )}
        </ResponseContentWrapper>
      ),
    },
    {
      key: DEBUGGER_TAB_KEYS.ERROR_TAB,
      title: createMessage(DEBUGGER_ERRORS),
      panelComponent: <ErrorLogs />,
    },
    {
      key: DEBUGGER_TAB_KEYS.LOGS_TAB,
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs searchQuery={actionName} />,
    },
    {
      key: DEBUGGER_TAB_KEYS.INSPECT_TAB,
      title: createMessage(INSPECT_ENTITY),
      panelComponent: <EntityDeps />,
    },
  ];

  const { entityDependencies, hasDependencies } = useEntityDependencies(
    props.actionName,
  );

  // when switching between different redux forms, make sure this redux form has been initialized before rendering anything.
  // the initialized prop below comes from redux-form.
  if (!props.initialized) {
    return null;
  }

  return (
    <>
      {!guidedTourEnabled && <CloseEditor />}
      {guidedTourEnabled && <Guide className="query-page" />}
      <QueryFormContainer onSubmit={handleSubmit}>
        <StyledFormRow>
          <NameWrapper>
            <ActionNameEditor />
          </NameWrapper>
          <ActionsWrapper>
            <MoreActionsMenu
              className="t--more-action-menu"
              id={currentActionConfig ? currentActionConfig.id : ""}
              name={currentActionConfig ? currentActionConfig.name : ""}
              pageId={pageId}
            />
            <DropdownSelect>
              <DropdownField
                className={"t--switch-datasource"}
                components={{ MenuList, Option: CustomOption, SingleValue }}
                maxMenuHeight={200}
                name="datasource.id"
                options={DATASOURCES_OPTIONS}
                placeholder="Datasource"
                width={232}
              />
            </DropdownSelect>
            <SearchSnippets
              className="search-snippets"
              entityId={currentActionConfig?.id}
              entityType={ENTITY_TYPE.ACTION}
            />
            <Button
              className="t--run-query"
              data-guided-tour-iid="run-query"
              isLoading={isRunning}
              onClick={onRunClick}
              size={Size.medium}
              tag="button"
              text="Run"
              type="button"
            />
          </ActionsWrapper>
        </StyledFormRow>
        <Wrapper>
          <SecondaryWrapper>
            <TabContainerView>
              {documentationLink && (
                <DocumentationLink>
                  <TooltipComponent
                    content={createMessage(DOCUMENTATION_TOOLTIP)}
                    hoverOpenDelay={50}
                    position="top"
                  >
                    <span
                      className="t--datasource-documentation-link"
                      onClick={(e: React.MouseEvent) =>
                        handleDocumentationClick(e)
                      }
                    >
                      <AdsIcon
                        keepColors
                        name="book-line"
                        size={IconSize.XXXL}
                      />
                      &nbsp;
                      {createMessage(DOCUMENTATION)}
                    </span>
                  </TooltipComponent>
                </DocumentationLink>
              )}
              <TabComponent
                tabs={[
                  {
                    key: EDITOR_TABS.QUERY,
                    title: "Query",
                    panelComponent: (
                      <SettingsWrapper>
                        {editorConfig && editorConfig.length > 0 ? (
                          renderConfig(editorConfig)
                        ) : (
                          <>
                            <ErrorMessage>
                              An unexpected error occurred
                            </ErrorMessage>
                            <Tag
                              intent="warning"
                              interactive
                              minimal
                              onClick={() => window.location.reload()}
                              round
                            >
                              Refresh
                            </Tag>
                          </>
                        )}
                        {dataSources.length === 0 && (
                          <NoDataSourceContainer>
                            <p className="font18">
                              Seems like you don’t have any Datasources to
                              create a query
                            </p>
                            <EditorButton
                              filled
                              icon="plus"
                              intent="primary"
                              onClick={() => onCreateDatasourceClick()}
                              size="small"
                              text="Add a Datasource"
                            />
                          </NoDataSourceContainer>
                        )}
                      </SettingsWrapper>
                    ),
                  },
                  {
                    key: EDITOR_TABS.SETTINGS,
                    title: "Settings",
                    panelComponent: (
                      <SettingsWrapper>
                        <ActionSettings
                          actionSettingsConfig={settingConfig}
                          formName={formName}
                        />
                      </SettingsWrapper>
                    ),
                  },
                ]}
              />
            </TabContainerView>

            <Boxed step={GUIDED_TOUR_STEPS.RUN_QUERY}>
              <TabbedViewContainer ref={panelRef}>
                <Resizable
                  panelRef={panelRef}
                  setContainerDimensions={(height: number) =>
                    setTableBodyHeightHeight(height)
                  }
                />
                {output && !!output.length && (
                  <ResultsCount>
                    <Text type={TextType.P3}>
                      Result:
                      <Text type={TextType.H5}>{`${output.length} Record${
                        output.length > 1 ? "s" : ""
                      }`}</Text>
                    </Text>
                  </ResultsCount>
                )}

                <EntityBottomTabs defaultIndex={0} tabs={responseTabs} />
              </TabbedViewContainer>
            </Boxed>
          </SecondaryWrapper>
          <SidebarWrapper
            show={(hasDependencies || !!output) && !guidedTourEnabled}
          >
            <ActionRightPane
              actionName={actionName}
              entityDependencies={entityDependencies}
              hasConnections={hasDependencies}
              hasResponse={!!output}
              suggestedWidgets={executedQueryData?.suggestedWidgets}
            />
          </SidebarWrapper>
        </Wrapper>
      </QueryFormContainer>
    </>
  );
}
