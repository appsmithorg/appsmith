import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { JSAction, JSCollection } from "entities/JSCollection";
import CloseEditor from "components/editorComponents/CloseEditor";
import MoreJSCollectionsMenu from "../Explorer/JSActions/MoreJSActionsMenu";
import { TabComponent } from "components/ads/Tabs";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import JSObjectNameEditor from "./JSObjectNameEditor";
import {
  setActiveJSAction,
  startExecutingJSFunction,
  updateJSCollectionBody,
} from "actions/jsPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Explorer/helpers";
import JSResponseView from "components/editorComponents/JSResponseView";
import { isEmpty } from "lodash";
import equal from "fast-deep-equal/es6";
import SearchSnippets from "components/ads/SnippetButton";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { JSFunctionRun } from "./JSFunctionRun";
import { AppState } from "@appsmith/reducers";
import {
  getActiveJSActionId,
  getIsExecutingJSAction,
  getJSActions,
  getJSCollectionParseErrors,
} from "selectors/entitiesSelector";
import {
  convertJSActionsToDropdownOptions,
  convertJSActionToDropdownOption,
  getActionFromJsCollection,
  getJSActionOption,
  getJSFunctionLineGutter,
  JSActionDropdownOption,
} from "./utils";
import { DropdownOnSelect } from "design-system";
import JSFunctionSettingsView from "./JSFunctionSettings";
import JSObjectHotKeys from "./JSObjectHotKeys";
import {
  ActionButtons,
  Form,
  FormWrapper,
  NameWrapper,
  SecondaryWrapper,
  StyledFormRow,
  TabbedViewContainer,
} from "./styledComponents";
import { EventLocation } from "utils/AnalyticsUtil";

interface JSFormProps {
  jsCollection: JSCollection;
}

type Props = JSFormProps;

function JSEditorForm({ jsCollection: currentJSCollection }: Props) {
  const theme = EditorTheme.LIGHT;
  const [mainTabIndex, setMainTabIndex] = useState(0);
  const dispatch = useDispatch();
  const { pageId } = useParams<ExplorerURLParams>();
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

  const [selectedJSActionOption, setSelectedJSActionOption] = useState<
    JSActionDropdownOption
  >(getJSActionOption(activeJSAction, jsActions));

  const isExecutingCurrentJSAction = useSelector((state: AppState) =>
    getIsExecutingJSAction(
      state,
      currentJSCollection.id,
      selectedJSActionOption.data?.id || "",
    ),
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
        collectionName: currentJSCollection.name || "",
        action: jsAction,
        collectionId: currentJSCollection.id || "",
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
      ),
    [jsActions, parseErrors, handleActiveActionChange],
  );

  const handleJSActionOptionSelection: DropdownOnSelect = (
    value,
    dropDownOption: JSActionDropdownOption,
  ) => {
    dropDownOption.data &&
      setSelectedJSActionOption(
        convertJSActionToDropdownOption(dropDownOption.data),
      );
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

  return (
    <FormWrapper>
      <JSObjectHotKeys
        runActiveJSFunction={(
          event: React.MouseEvent<HTMLElement, MouseEvent> | KeyboardEvent,
        ) => {
          handleRunAction(event, "KEYBOARD_SHORTCUT");
        }}
      >
        <CloseEditor />
        <Form>
          <StyledFormRow className="form-row-header">
            <NameWrapper className="t--nameOfJSObject">
              <JSObjectNameEditor page="JS_PANE" />
            </NameWrapper>
            <ActionButtons className="t--formActionButtons">
              <MoreJSCollectionsMenu
                className="t--more-action-menu"
                id={currentJSCollection.id}
                name={currentJSCollection.name}
                pageId={pageId}
              />
              <SearchSnippets
                entityId={currentJSCollection?.id}
                entityType={ENTITY_TYPE.JSACTION}
              />
              <JSFunctionRun
                disabled={disableRunFunctionality}
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
          <SecondaryWrapper>
            <TabbedViewContainer isExecuting={isExecutingCurrentJSAction}>
              <TabComponent
                onSelect={setMainTabIndex}
                selectedIndex={mainTabIndex}
                tabs={[
                  {
                    key: "code",
                    title: "Code",
                    panelComponent: (
                      <CodeEditor
                        blockCompletions={blockCompletions}
                        className={"js-editor"}
                        customGutter={JSGutters}
                        dataTreePath={`${currentJSCollection.name}.body`}
                        folding
                        height={"100%"}
                        hideEvaluatedValue
                        input={{
                          value: currentJSCollection.body,
                          onChange: handleEditorChange,
                        }}
                        isJSObject
                        mode={EditorModes.JAVASCRIPT}
                        placeholder="Let's write some code!"
                        showLightningMenu={false}
                        showLineNumbers
                        size={EditorSize.EXTENDED}
                        tabBehaviour={TabBehaviour.INDENT}
                        theme={theme}
                      />
                    ),
                  },
                  {
                    key: "settings",
                    title: "Settings",
                    panelComponent: (
                      <JSFunctionSettingsView actions={jsActions} />
                    ),
                  },
                ]}
              />
            </TabbedViewContainer>
            <JSResponseView
              currentFunction={activeResponse}
              disabled={disableRunFunctionality}
              errors={parseErrors}
              isLoading={isExecutingCurrentJSAction}
              jsObject={currentJSCollection}
              onButtonClick={(
                event:
                  | React.MouseEvent<HTMLElement, MouseEvent>
                  | KeyboardEvent,
              ) => {
                handleRunAction(event, "JS_OBJECT_RESPONSE_RUN_BUTTON");
              }}
              theme={theme}
            />
          </SecondaryWrapper>
        </Form>
      </JSObjectHotKeys>
    </FormWrapper>
  );
}

export default JSEditorForm;
