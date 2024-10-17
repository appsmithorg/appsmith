import type { ChangeEvent } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { JSAction } from "entities/JSCollection";
import type { DropdownOnSelect } from "@appsmith/ads-old";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { JSObjectNameEditorProps } from "./JSObjectNameEditor";
import JSObjectNameEditor from "./JSObjectNameEditor";
import {
  setActiveJSAction,
  setJsPaneConfigSelectedTab,
  setJsPaneDebuggerState,
  startExecutingJSFunction,
  updateJSCollectionBody,
} from "actions/jsPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import JSResponseView from "components/editorComponents/JSResponseView";
import { isEmpty } from "lodash";
import equal from "fast-deep-equal/es6";
import { JSFunctionRun } from "./JSFunctionRun";
import type { AppState } from "ee/reducers";
import {
  getActiveJSActionId,
  getIsExecutingJSAction,
  getJSActions,
  getJSCollectionParseErrors,
} from "ee/selectors/entitiesSelector";
import type { JSActionDropdownOption } from "./utils";
import {
  convertJSActionsToDropdownOptions,
  convertJSActionToDropdownOption,
  getActionFromJsCollection,
  getJSActionOption,
  getJSFunctionLineGutter,
  getJSPropertyLineFromName,
} from "./utils";
import type { JSFunctionSettingsProps } from "./JSFunctionSettings";
import JSObjectHotKeys from "./JSObjectHotKeys";
import {
  ActionButtons,
  Form,
  FormWrapper,
  NameWrapper,
  StyledFormRow,
} from "./styledComponents";
import { getJSPaneConfigSelectedTab } from "selectors/jsPaneSelectors";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import {
  setCodeEditorCursorAction,
  setFocusableInputField,
} from "actions/editorContextActions";
import history from "utils/history";
import { CursorPositionOrigin } from "ee/reducers/uiReducers/editorContextReducer";
import styled from "styled-components";
import type { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  getHasExecuteActionPermission,
  getHasManageActionPermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import RunHistory from "ee/components/RunHistory";
import { JSEditorForm as EditorForm } from "./JSEditorForm";

interface JSFormProps {
  jsCollectionData: JSCollectionData;
  contextMenu: React.ReactNode;
  showSettings?: boolean;
  onUpdateSettings: JSFunctionSettingsProps["onUpdateSettings"];
  saveJSObjectName: JSObjectNameEditorProps["saveJSObjectName"];
  backLink?: React.ReactNode;
  hideContextMenuOnEditor?: boolean;
  hideEditIconOnEditor?: boolean;
  notification?: React.ReactNode;
}

type Props = JSFormProps;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
  overflow: hidden;
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

const StyledNotificationWrapper = styled.div`
  padding: 0 var(--ads-v2-spaces-7) var(--ads-v2-spaces-3)
    var(--ads-v2-spaces-7);
`;

function JSEditorForm({
  backLink,
  contextMenu,
  hideContextMenuOnEditor = false,
  hideEditIconOnEditor = false,
  jsCollectionData,
  notification,
  onUpdateSettings,
  saveJSObjectName,
  showSettings = true,
}: Props) {
  const theme = EditorTheme.LIGHT;
  const dispatch = useDispatch();
  const { hash } = useLocation();
  const currentJSCollection = jsCollectionData.config;

  const [disableRunFunctionality, setDisableRunFunctionality] = useState(false);

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
  // Currently active response (only changes upon execution)
  const [activeResponse, setActiveResponse] = useState<JSAction | null>(
    activeJSAction,
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

      if (currentJSCollection.body) {
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditorChange = (valueOrEvent: ChangeEvent<any> | string) => {
    const value: string =
      typeof valueOrEvent === "string"
        ? valueOrEvent
        : valueOrEvent.target.value;

    dispatch(updateJSCollectionBody(value, currentJSCollection.id));
  };

  // Executes JS action
  const executeJSAction = (jsAction: JSAction, from: EventLocation) => {
    dispatch(
      setJsPaneDebuggerState({
        open: true,
        selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
      }),
    );
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
                disabled={!isChangePermitted || hideEditIconOnEditor}
                saveJSObjectName={saveJSObjectName}
              />
            </NameWrapper>
            <ActionButtons className="t--formActionButtons">
              {!hideContextMenuOnEditor && contextMenu}
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
          {notification && (
            <StyledNotificationWrapper>
              {notification}
            </StyledNotificationWrapper>
          )}
          <Wrapper>
            <div className="flex flex-1 w-full">
              <SecondaryWrapper>
                <EditorForm
                  actions={jsActions}
                  blockCompletions={blockCompletions}
                  changePermitted={isChangePermitted}
                  currentJSCollection={currentJSCollection}
                  customGutter={JSGutters}
                  executing={isExecutingCurrentJSAction}
                  onChange={handleEditorChange}
                  onUpdateSettings={onUpdateSettings}
                  onValueChange={(string) =>
                    setSelectedConfigTab(string as JSEditorTab)
                  }
                  showSettings={showSettings}
                  theme={theme}
                  value={selectedConfigTab}
                />
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
                <RunHistory />
              </SecondaryWrapper>
            </div>
          </Wrapper>
        </Form>
      </JSObjectHotKeys>
    </FormWrapper>
  );
}

export default JSEditorForm;
