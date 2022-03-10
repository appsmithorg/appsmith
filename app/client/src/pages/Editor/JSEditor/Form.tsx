import React, { useEffect, useMemo, useRef, useState } from "react";
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
  updateJSCollectionBody,
} from "actions/jsPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Explorer/helpers";
import JSResponseView from "components/editorComponents/JSResponseView";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import { get, isEmpty, isEqual } from "lodash";
import { getDataTree } from "selectors/dataTreeSelectors";
import { EvaluationError } from "utils/DynamicBindingUtils";
import SearchSnippets from "components/ads/SnippetButton";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { JSFunctionRun } from "./JSFunctionRun";
import { AppState } from "reducers";
import {
  getActiveJSActionId,
  getIsExecutingJSAction,
  getJSActions,
} from "selectors/entitiesSelector";
import {
  convertJSActionsToDropdownOptions,
  convertJSActionToDropdownOption,
  getActionFromJsCollection,
  getJSFunctionsLineGutters,
  JSActionDropdownOption,
} from "./utils";
import { NO_FUNCTION_DROPDOWN_OPTION } from "./constants";
import { DropdownOnSelect } from "components/ads";
import { isMac } from "utils/helpers";
import { Severity } from "entities/AppsmithConsole";
import JSFunctionSettingsView from "./JSFunctionSettingsView";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.backBanner}
  );
  overflow: hidden;
  width: 100%;
  ${FormLabel} {
    padding: ${(props) => props.theme.spaces[3]}px;
  }
  ${FormRow} {
    ${FormLabel} {
      padding: 0;
      width: 100%;
    }
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
  height: 100%;
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
  jsAction: JSCollection;
  settingsConfig: any;
}

type Props = JSFormProps;

function JSEditorForm(props: Props) {
  const theme = EditorTheme.LIGHT;
  const [mainTabIndex, setMainTabIndex] = useState(0);
  const dispatch = useDispatch();
  const currentJSAction = props.jsAction;
  const dataTree = useSelector(getDataTree);
  const { pageId } = useParams<ExplorerURLParams>();
  const [disableRunFunctionality, setDisableRunFunctionality] = useState(false);
  const [showResponse, setshowResponse] = useState(false);

  const getErrors = get(
    dataTree,
    `${currentJSAction.name}.${EVAL_ERROR_PATH}.body`,
    [],
  ) as EvaluationError[];

  const errors = getErrors.filter((er) => {
    return er.severity === Severity.ERROR;
  });

  const jsActions = useSelector(
    (state: AppState) => getJSActions(state, currentJSAction.id),
    isEqual,
  );
  const activeJSActionId = useSelector((state: AppState) =>
    getActiveJSActionId(state, currentJSAction.id),
  );

  const [selectedJSActionOption, setSelectedJSActionOption] = useState<
    JSActionDropdownOption
  >(() => {
    const activeJsAction =
      activeJSActionId &&
      getActionFromJsCollection(activeJSActionId, currentJSAction);
    return (
      (activeJsAction && convertJSActionToDropdownOption(activeJsAction)) ||
      (jsActions.length && convertJSActionToDropdownOption(jsActions[0])) ||
      NO_FUNCTION_DROPDOWN_OPTION
    );
  });

  const handleOnChange = (event: string) => {
    showResponse && setshowResponse(false);
    if (currentJSAction) {
      dispatch(updateJSCollectionBody(event, currentJSAction.id));
    }
  };

  const isExecutingCurrentJSAction = useSelector((state: AppState) =>
    getIsExecutingJSAction(
      state,
      currentJSAction.id,
      selectedJSActionOption.data?.id || "",
    ),
  );

  const runJSAction = (jsAction: JSAction) => {
    setshowResponse(true);
    setSelectedJSActionOption(convertJSActionToDropdownOption(jsAction));
    dispatch(
      executeJSFunction({
        collectionName: currentJSAction.name || "",
        action: jsAction,
        collectionId: currentJSAction.id || "",
      }),
    );
  };

  const JSGutters = useMemo(
    () => getJSFunctionsLineGutters(jsActions, runJSAction, !errors.length),
    [jsActions, errors],
  );

  const customKeyMap = {
    combination: isMac() ? "Cmd-Enter" : "Ctrl-Enter",
    onKeyDown: () => {
      selectedJSActionOption.data && runJSAction(selectedJSActionOption.data);
    },
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

  const handleButtonClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
  ) => {
    event.preventDefault();
    selectedJSActionOption.data && runJSAction(selectedJSActionOption.data);
  };

  useEffect(() => {
    const activeJsAction =
      activeJSActionId &&
      getActionFromJsCollection(activeJSActionId, currentJSAction);
    if (activeJsAction) {
      setSelectedJSActionOption(
        convertJSActionToDropdownOption(activeJsAction),
      );
    } else {
      if (!isEmpty(jsActions)) {
        setSelectedJSActionOption(
          convertJSActionToDropdownOption(jsActions[0]),
        );
      }
    }
  }, [activeJSActionId]);

  useEffect(() => {
    if (isEmpty(jsActions)) {
      setSelectedJSActionOption(NO_FUNCTION_DROPDOWN_OPTION);
      !disableRunFunctionality && setDisableRunFunctionality(true);
    } else {
      disableRunFunctionality && setDisableRunFunctionality(false);
    }
  }, [jsActions]);

  useEffect(() => {
    if (errors && errors.length) {
      setDisableRunFunctionality(true);
    }
  }, [errors]);

  useEffect(() => {
    const activeJsAction =
      activeJSActionId &&
      getActionFromJsCollection(activeJSActionId, currentJSAction);
    setSelectedJSActionOption(
      (activeJsAction && convertJSActionToDropdownOption(activeJsAction)) ||
        (jsActions.length && convertJSActionToDropdownOption(jsActions[0])) ||
        NO_FUNCTION_DROPDOWN_OPTION,
    );
  }, [currentJSAction]);

  return (
    <>
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
                jsCollection={currentJSAction}
                onButtonClick={handleButtonClick}
                onSelect={handleJSActionOptionSelection}
                options={convertJSActionsToDropdownOptions(jsActions)}
                selected={selectedJSActionOption}
                showTooltip={!selectedJSActionOption.data}
              />
              <SearchSnippets
                entityId={currentJSAction?.id}
                entityType={ENTITY_TYPE.JSACTION}
              />
              <MoreJSCollectionsMenu
                className="t--more-action-menu"
                id={currentJSAction.id}
                name={currentJSAction.name}
                pageId={pageId}
              />
            </ActionButtons>
          </FormRow>
        </MainConfiguration>
        <SecondaryWrapper>
          <TabbedViewContainer>
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
                      customKeyMap={customKeyMap}
                      dataTreePath={`${currentJSAction.name}.body`}
                      folding
                      height={"100%"}
                      hideEvaluatedValue
                      input={{
                        value: currentJSAction.body,
                        onChange: (event: any) => handleOnChange(event),
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
            errors={errors}
            jsObject={currentJSAction}
            showResponse={showResponse}
            theme={theme}
          />
        </SecondaryWrapper>
      </Form>
    </>
  );
}

export default JSEditorForm;
