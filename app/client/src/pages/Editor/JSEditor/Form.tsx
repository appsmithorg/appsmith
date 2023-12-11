import type { ChangeEvent } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { JSAction } from "entities/JSCollection";
import type { DropdownOnSelect } from "design-system-old";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { JSObjectNameEditorProps } from "./JSObjectNameEditor";
import JSObjectNameEditor from "./JSObjectNameEditor";
import {
  setActiveJSAction,
  setJsPaneConfigSelectedTab,
  startExecutingJSFunction,
  updateJSCollectionBody,
} from "actions/jsPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import JSResponseView from "components/editorComponents/JSResponseView";
import { isEmpty } from "lodash";
import equal from "fast-deep-equal/es6";
import { JSFunctionRun } from "./JSFunctionRun";
import type { AppState } from "@appsmith/reducers";
import {
  getActiveJSActionId,
  getIsExecutingJSAction,
  getJSActions,
  getJSCollectionParseErrors,
} from "@appsmith/selectors/entitiesSelector";
import type { JSActionDropdownOption } from "./utils";
import {
  convertJSActionsToDropdownOptions,
  convertJSActionToDropdownOption,
  getActionFromJsCollection,
  getJSActionOption,
  getJSFunctionLineGutter,
  getJSPropertyLineFromName,
} from "./utils";
import JSFunctionSettingsView from "./JSFunctionSettings";
import type { JSFunctionSettingsProps } from "./JSFunctionSettings";
import JSObjectHotKeys from "./JSObjectHotKeys";
import {
  ActionButtons,
  Form,
  FormWrapper,
  NameWrapper,
  StyledFormRow,
  TabbedViewContainer,
} from "./styledComponents";
import { getJSPaneConfigSelectedTab } from "selectors/jsPaneSelectors";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import {
  setCodeEditorCursorAction,
  setFocusableInputField,
} from "actions/editorContextActions";
import history from "utils/history";
import { CursorPositionOrigin } from "@appsmith/reducers/uiReducers/editorContextReducer";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import styled from "styled-components";
import { showDebuggerFlag } from "selectors/debuggerSelectors";
import { Tab, TabPanel, Tabs, TabsList } from "design-system";
import { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasExecuteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";

interface JSFormProps {
  jsCollectionData: JSCollectionData;
  contextMenu: React.ReactNode;
  showSettings?: boolean;
  onUpdateSettings: JSFunctionSettingsProps["onUpdateSettings"];
  saveJSObjectName: JSObjectNameEditorProps["saveJSObjectName"];
  backLink?: React.ReactNode;
}

type Props = JSFormProps;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 64px);
  width: 100%;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  &&& {
    .ads-v2-tabs,
    &.js-editor-tab {
      height: 100%;
    }
  }
`;

function JSEditorForm({
  backLink,
  contextMenu,
  jsCollectionData,
  onUpdateSettings,
  saveJSObjectName,
  showSettings = true,
}: Props) {
  const theme = EditorTheme.LIGHT;
  const dispatch = useDispatch();
  const { hash } = useLocation();
  const currentJSCollection = jsCollectionData.config;

  const [disableRunFunctionality, setDisableRunFunctionality] = useState(false);

  // Currently active response (only changes upon execution)
  const [activeResponse, setActiveResponse] = useState<JSAction | null>(null);
  const parseErrors = useSelector(
    (state: AppState) =>
      getJSCollectionParseErrors(state, currentJSCollection.name),
    equal,
  );
  const jsActions = useSelector(
    (state: AppState) => getJSActions(state, currentJSCollection.id),
    equal,
  );
  const activeJSActionId = useSelector((state: AppState) =>
    getActiveJSActionId(state, currentJSCollection.id),
  );

  const activeJSAction = getActionFromJsCollection(
    activeJSActionId,
    currentJSCollection,
  );

  const [selectedJSActionOption, setSelectedJSActionOption] =
    useState<JSActionDropdownOption>(
      getJSActionOption(activeJSAction, jsActions),
    );

  const isExecutingCurrentJSAction = useSelector((state: AppState) =>
    getIsExecutingJSAction(
      state,
      currentJSCollection.id,
      selectedJSActionOption.data?.id || "",
    ),
  );

  useEffect(() => {
    if (hash) {
      // Hash here could mean to navigate (set cursor/focus) to a particular function
      // If the hash has a function name in this JS Object, we will set that
      const actionName = hash.substring(1);
      const position = getJSPropertyLineFromName(
        currentJSCollection.body,
        actionName,
      );
      if (position) {
        // Resetting the focus and position based on the cmd click navigation
        dispatch(setFocusableInputField(`${currentJSCollection.name}.body`));
        dispatch(
          setCodeEditorCursorAction(
            `${currentJSCollection.name}.body`,
            position,
            CursorPositionOrigin.Navigation,
          ),
        );
        // Replace to remove the hash and set back the original URL
        history.replace(window.location.pathname + window.location.search);
      }
    }
  }, [hash]);

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    currentJSCollection?.userPermissions || [],
  );
  const isExecutePermitted = getHasExecuteActionPermission(
    isFeatureEnabled,
    currentJSCollection?.userPermissions || [],
  );

  // Triggered when there is a change in the code editor
  const handleEditorChange = (valueOrEvent: ChangeEvent<any> | string) => {
    const value: string =
      typeof valueOrEvent === "string"
        ? valueOrEvent
        : valueOrEvent.target.value;

    dispatch(updateJSCollectionBody(value, currentJSCollection.id));
  };

  // Executes JS action
  const executeJSAction = (jsAction: JSAction, from: EventLocation) => {
    setActiveResponse(jsAction);
    if (jsAction.id !== selectedJSActionOption.data?.id)
      setSelectedJSActionOption(convertJSActionToDropdownOption(jsAction));
    dispatch(
      setActiveJSAction({
        jsCollectionId: currentJSCollection.id || "",
        jsActionId: jsAction.id || "",
      }),
    );
    dispatch(
      startExecutingJSFunction({
        action: jsAction,
        collection: currentJSCollection,
        from: from,
      }),
    );
  };

  const handleActiveActionChange = useCallback(
    (jsAction: JSAction) => {
      if (!jsAction) return;

      // only update when there is a new active action
      if (jsAction.id !== selectedJSActionOption.data?.id) {
        setSelectedJSActionOption(convertJSActionToDropdownOption(jsAction));
      }
    },
    [selectedJSActionOption],
  );

  const JSGutters = useMemo(
    () =>
      getJSFunctionLineGutter(
        jsActions,
        executeJSAction,
        !parseErrors.length,
        handleActiveActionChange,
        isExecutePermitted,
      ),
    [jsActions, parseErrors, handleActiveActionChange, isExecutePermitted],
  );

  const handleJSActionOptionSelection: DropdownOnSelect = (value) => {
    if (value) {
      const jsAction = getActionFromJsCollection(value, currentJSCollection);
      if (jsAction) {
        setSelectedJSActionOption({
          data: jsAction,
          value,
          label: jsAction.name,
        });
      }
    }
  };

  const handleRunAction = (
    event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
    from: EventLocation,
  ) => {
    event.preventDefault();
    if (
      !disableRunFunctionality &&
      !isExecutingCurrentJSAction &&
      selectedJSActionOption.data
    ) {
      executeJSAction(selectedJSActionOption.data, from);
    }
  };

  useEffect(() => {
    if (parseErrors.length || isEmpty(jsActions)) {
      setDisableRunFunctionality(true);
    } else {
      setDisableRunFunctionality(false);
    }
  }, [parseErrors, jsActions, activeJSActionId]);

  useEffect(() => {
    // update the selectedJSActionOption when there is addition or removal of jsAction or function
    setSelectedJSActionOption(getJSActionOption(activeJSAction, jsActions));
  }, [jsActions, activeJSActionId]);

  const blockCompletions = useMemo(() => {
    if (selectedJSActionOption.label) {
      const funcName = `${selectedJSActionOption.label}()`;
      return [
        {
          parentPath: "this",
          subPath: funcName,
        },
        {
          parentPath: currentJSCollection.name,
          subPath: funcName,
        },
      ];
    }
    return [];
  }, [selectedJSActionOption.label, currentJSCollection.name]);

  const selectedConfigTab = useSelector(getJSPaneConfigSelectedTab);

  // Debugger render flag
  const showDebugger = useSelector(showDebuggerFlag);

  const setSelectedConfigTab = useCallback((selectedTab: JSEditorTab) => {
    dispatch(setJsPaneConfigSelectedTab(selectedTab));
  }, []);

  return (
    <FormWrapper>
      <JSObjectHotKeys
        runActiveJSFunction={(
          event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
        ) => {
          handleRunAction(event, "KEYBOARD_SHORTCUT");
        }}
      >
        {backLink}
        <Form onSubmit={(event) => event.preventDefault()}>
          <StyledFormRow className="form-row-header">
            <NameWrapper className="t--nameOfJSObject">
              <JSObjectNameEditor
                disabled={!isChangePermitted}
                saveJSObjectName={saveJSObjectName}
              />
            </NameWrapper>
            <ActionButtons className="t--formActionButtons">
              {contextMenu}
              <JSFunctionRun
                disabled={disableRunFunctionality || !isExecutePermitted}
                isLoading={isExecutingCurrentJSAction}
                jsCollection={currentJSCollection}
                onButtonClick={(
                  event:
                    | React.MouseEvent<HTMLElement, MouseEvent>
                    | KeyboardEvent,
                ) => {
                  handleRunAction(event, "JS_OBJECT_MAIN_RUN_BUTTON");
                }}
                onSelect={handleJSActionOptionSelection}
                options={convertJSActionsToDropdownOptions(jsActions)}
                selected={selectedJSActionOption}
                showTooltip={!selectedJSActionOption.data}
              />
            </ActionButtons>
          </StyledFormRow>
          <Wrapper>
            <div className="flex flex-1">
              <SecondaryWrapper>
                <TabbedViewContainer isExecuting={isExecutingCurrentJSAction}>
                  <Tabs
                    defaultValue={JSEditorTab.CODE}
                    onValueChange={(string) =>
                      setSelectedConfigTab(string as JSEditorTab)
                    }
                    value={selectedConfigTab}
                  >
                    <TabsList>
                      <Tab
                        data-testid={`t--js-editor-` + JSEditorTab.CODE}
                        value={JSEditorTab.CODE}
                      >
                        Code
                      </Tab>
                      {showSettings && (
                        <Tab
                          data-testid={`t--js-editor-` + JSEditorTab.SETTINGS}
                          value={JSEditorTab.SETTINGS}
                        >
                          Settings
                        </Tab>
                      )}
                    </TabsList>
                    <TabPanel value={JSEditorTab.CODE}>
                      <div className="js-editor-tab">
                        <LazyCodeEditor
                          AIAssisted
                          blockCompletions={blockCompletions}
                          border={CodeEditorBorder.NONE}
                          borderLess
                          className={"js-editor"}
                          customGutter={JSGutters}
                          dataTreePath={`${currentJSCollection.name}.body`}
                          disabled={!isChangePermitted}
                          folding
                          height={"100%"}
                          hideEvaluatedValue
                          input={{
                            value: currentJSCollection.body,
                            onChange: handleEditorChange,
                          }}
                          isJSObject
                          jsObjectName={currentJSCollection.name}
                          mode={EditorModes.JAVASCRIPT}
                          placeholder="Let's write some code!"
                          showLightningMenu={false}
                          showLineNumbers
                          size={EditorSize.EXTENDED}
                          tabBehaviour={TabBehaviour.INDENT}
                          theme={theme}
                        />
                      </div>
                    </TabPanel>
                    {showSettings && (
                      <TabPanel value={JSEditorTab.SETTINGS}>
                        <div className="js-editor-tab">
                          <JSFunctionSettingsView
                            actions={jsActions}
                            disabled={!isChangePermitted}
                            onUpdateSettings={onUpdateSettings}
                          />
                        </div>
                      </TabPanel>
                    )}
                  </Tabs>
                </TabbedViewContainer>
                {showDebugger ? (
                  <JSResponseView
                    currentFunction={activeResponse}
                    disabled={disableRunFunctionality || !isExecutePermitted}
                    errors={parseErrors}
                    isLoading={isExecutingCurrentJSAction}
                    jsCollectionData={jsCollectionData}
                    onButtonClick={(
                      event:
                        | React.MouseEvent<HTMLElement, MouseEvent>
                        | KeyboardEvent,
                    ) => {
                      handleRunAction(event, "JS_OBJECT_RESPONSE_RUN_BUTTON");
                    }}
                    theme={theme}
                  />
                ) : null}
              </SecondaryWrapper>
            </div>
          </Wrapper>
        </Form>
      </JSObjectHotKeys>
    </FormWrapper>
  );
}

export default JSEditorForm;
