import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled from "styled-components";
import { JSAction, JSCollection } from "entities/JSCollection";
import CloseEditor from "components/editorComponents/CloseEditor";
import MoreJSCollectionsMenu from "../Explorer/JSActions/MoreJSActionsMenu";
import { TabComponent } from "components/ads/Tabs";
import FormLabel from "components/editorComponents/FormLabel";
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
  executeJSFunction,
  setActiveJSAction,
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
import { JS_OBJECT_HOTKEYS_CLASSNAME } from "./constants";
import { DropdownOnSelect } from "components/ads";
import JSFunctionSettingsView from "./JSFunctionSettings";
import JSObjectHotKeys from "./JSObjectHotKeys";

const FormWrapper = styled.div`
  height: ${({ theme }) =>
    `calc(100vh - ${theme.smallHeaderHeight} - ${theme.backBanner})`};
  overflow: hidden;
  .${JS_OBJECT_HOTKEYS_CLASSNAME} {
    width: 100%;
    height: 100%;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: ${({ theme }) => `calc(100% - ${theme.backBanner})`};
  overflow: hidden;
  ${FormLabel} {
    padding: ${(props) => props.theme.spaces[3]}px;
  }
  ${FormRow} {
    ${FormLabel} {
      padding: 0;
      width: 100%;
    }
  }
  .t--no-binding-prompt {
    display: none;
  }
`;

const NameWrapper = styled.div`
  width: 49%;
  display: flex;
  align-items: center;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

const ActionButtons = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;

  button:last-child {
    margin: 0 ${(props) => props.theme.spaces[7]}px;
    height: 30px;
  }
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px);
  overflow: hidden;
`;
const MainConfiguration = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[10]}px 0px
    ${(props) => props.theme.spaces[10]}px;
`;

export const TabbedViewContainer = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
  border-top: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  ${FormRow} {
    min-height: auto;
    padding: ${(props) => props.theme.spaces[0]}px;
    & > * {
      margin-right: 0px;
    }
  }

  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
    }
    .react-tabs__tab-panel {
      height: calc(100% - 36px);
      margin-top: 2px;
      background-color: ${(props) => props.theme.colors.apiPane.bg};
    }
  }
`;
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
  const [showResponse, setshowResponse] = useState(false);
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

  const handleEditorChange = (valueOrEvent: ChangeEvent<any> | string) => {
    const value: string =
      typeof valueOrEvent === "string"
        ? valueOrEvent
        : valueOrEvent.target.value;

    showResponse && setshowResponse(false);
    dispatch(updateJSCollectionBody(value, currentJSCollection.id));
  };

  const isExecutingCurrentJSAction = useSelector((state: AppState) =>
    getIsExecutingJSAction(
      state,
      currentJSCollection.id,
      selectedJSActionOption.data?.id || "",
    ),
  );

  const executeJSAction = (jsAction: JSAction) => {
    setshowResponse(true);
    setSelectedJSActionOption(convertJSActionToDropdownOption(jsAction));
    dispatch(
      setActiveJSAction({
        jsCollectionId: currentJSCollection.id || "",
        jsActionId: jsAction.id || "",
      }),
    );
    dispatch(
      executeJSFunction({
        collectionName: currentJSCollection.name || "",
        action: jsAction,
        collectionId: currentJSCollection.id || "",
      }),
    );
  };

  const handleActiveActionChange = useCallback(
    (jsAction: JSAction) => {
      if (!jsAction) return;
      if (jsAction.id !== selectedJSActionOption.data?.id) {
        setSelectedJSActionOption(convertJSActionToDropdownOption(jsAction));
        setshowResponse(false);
        dispatch(
          setActiveJSAction({
            jsCollectionId: currentJSCollection.id || "",
            jsActionId: jsAction.id || "",
          }),
        );
      }
    },
    [selectedJSActionOption],
  );

  const JSGutters = useMemo(
    () =>
      getJSFunctionLineGutter(
        jsActions,
        executeJSAction,
        handleActiveActionChange,
        !parseErrors.length,
      ),
    [jsActions, parseErrors, selectedJSActionOption],
  );

  const handleTabSwitch = (tabIndex: number) => {
    setMainTabIndex(tabIndex);
    setshowResponse(false);
  };

  const handleJSActionOptionSelection: DropdownOnSelect = (
    value,
    dropDownOption: JSActionDropdownOption,
  ) => {
    setshowResponse(false);
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
  }, [parseErrors, jsActions]);

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
                <SearchSnippets
                  entityId={currentJSCollection?.id}
                  entityType={ENTITY_TYPE.JSACTION}
                />
                <MoreJSCollectionsMenu
                  className="t--more-action-menu"
                  id={currentJSCollection.id}
                  name={currentJSCollection.name}
                  pageId={pageId}
                />
              </ActionButtons>
            </FormRow>
          </MainConfiguration>
          <SecondaryWrapper>
            <TabbedViewContainer>
              <TabComponent
                onSelect={handleTabSwitch}
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
              currentFunction={selectedJSActionOption.data}
              disabled={disableRunFunctionality}
              errors={parseErrors}
              isLoading={isExecutingCurrentJSAction}
              jsObject={currentJSCollection}
              onButtonClick={handleRunAction}
              showResponse={showResponse}
              theme={theme}
            >
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
            </JSResponseView>
          </SecondaryWrapper>
        </Form>
      </JSObjectHotKeys>
    </FormWrapper>
  );
}

export default JSEditorForm;
