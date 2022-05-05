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
import FormRow from "components/editorComponents/FormRow";
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
import { isEmpty, isEqual } from "lodash";
import SearchSnippets from "components/ads/SnippetButton";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { JSFunctionRun } from "./JSFunctionRun";
import { AppState } from "reducers";
import {
  getActiveJSActionId,
  getIsExecutingJSAction,
  getIsSavingJSCollection,
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
import { DropdownOnSelect } from "components/ads";
import JSFunctionSettingsView from "./JSFunctionSettings";
import JSObjectHotKeys from "./JSObjectHotKeys";
import {
  ActionButtons,
  Form,
  FormWrapper,
  MainConfiguration,
  NameWrapper,
  SecondaryWrapper,
  TabbedViewContainer,
} from "./styledComponents";

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
    isEqual,
  );
  const jsActions = useSelector(
    (state: AppState) => getJSActions(state, currentJSCollection.id),
    isEqual,
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

  const isSavingCurrentJSCollection = useSelector((state: AppState) =>
    getIsSavingJSCollection(state, currentJSCollection.id),
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
  const executeJSAction = (jsAction: JSAction) => {
    if (isSavingCurrentJSCollection) return;
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
  ) => {
    event.preventDefault();
    selectedJSActionOption.data && executeJSAction(selectedJSActionOption.data);
  };

  useEffect(() => {
    if (parseErrors.length || isEmpty(jsActions)) {
      setDisableRunFunctionality(true);
    } else {
      setDisableRunFunctionality(false);
    }
    setSelectedJSActionOption(getJSActionOption(activeJSAction, jsActions));
  }, [parseErrors, jsActions, activeJSActionId]);
  return (
    <FormWrapper>
      <JSObjectHotKeys runActiveJSFunction={handleRunAction}>
        <CloseEditor />
        <Form>
          <MainConfiguration>
            <FormRow className="form-row-header">
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
                  onButtonClick={handleRunAction}
                  onSelect={handleJSActionOptionSelection}
                  options={convertJSActionsToDropdownOptions(jsActions)}
                  selected={selectedJSActionOption}
                  showTooltip={!selectedJSActionOption.data}
                />
              </ActionButtons>
            </FormRow>
          </MainConfiguration>
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
              onButtonClick={handleRunAction}
              theme={theme}
            />
          </SecondaryWrapper>
        </Form>
      </JSObjectHotKeys>
    </FormWrapper>
  );
}

export default JSEditorForm;
