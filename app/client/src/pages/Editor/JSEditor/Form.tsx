import React, { useState, useRef, RefObject } from "react";
import styled from "styled-components";
import { JS_EDITOR_FORM } from "constants/forms";
import { JSAction } from "entities/JSAction";
import CloseEditor from "components/editorComponents/CloseEditor";
import MoreJSActionsMenu from "../Explorer/JSActions/MoreJSActionsMenu";
import Button, { Size } from "components/ads/Button";
import { TabComponent } from "components/ads/Tabs";
import FormLabel from "components/editorComponents/FormLabel";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { reduxForm } from "redux-form";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Resizable from "components/editorComponents/Debugger/Resizer";
import { TabbedViewContainer } from "../QueryEditor/EditorJSONtoForm";
import FormRow from "components/editorComponents/FormRow";
import JSActionNameEditor from "./JSActionNameEditor";
import { updateJSAction } from "actions/jsPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Explorer/helpers";
import { thinScrollbar } from "constants/DefaultTheme";

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
  margin: 20px;
`;

const ActionButtons = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px);
  margin-top: 20px;
`;

const TabContainerView = styled.div`
  flex: 1;
  overflow: auto;
  border-top: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  margin-top 5px;
  ${thinScrollbar}
  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 15px;
  }
  .react-tabs__tab-panel {
    overflow: scroll;
    margin-top: 2px;
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
interface JSFormProps {
  jsAction: JSAction;
  settingsConfig: any;
}

type Props = JSFormProps;

function JSEditorForm() {
  const theme = EditorTheme.LIGHT;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mainTabIndex, setMainTabIndex] = useState(0);
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const dispatch = useDispatch();
  const responseTabs = [
    {
      key: "Response",
      title: "Response",
      panelComponent: <div />,
    },
    {
      key: "ERROR",
      title: "Errors",
      panelComponent: <ErrorLogs />,
    },
    {
      key: "CONSOLE",
      title: "Console",
      panelComponent: <DebuggerLogs searchQuery={""} />,
    },
  ];
  const onTabSelect = (index: number) => {
    const debuggerTabKeys = ["ERROR", "CONSOLE"];
    if (
      debuggerTabKeys.includes(responseTabs[index].key) &&
      debuggerTabKeys.includes(responseTabs[selectedIndex].key)
    ) {
      AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
        tabName: responseTabs[index].key,
      });
    }

    setSelectedIndex(index);
  };
  const params = useParams<{ collectionId: string }>();

  const jsActions: JSAction[] = useSelector((state: AppState) =>
    state.entities.jsActions.map((js) => js.config),
  );
  const currentJSAction: JSAction | undefined = jsActions.find(
    (js) => js.id === params.collectionId,
  );
  const handleOnChange = (event: string) => {
    if (currentJSAction) {
      dispatch(updateJSAction(event, currentJSAction.id));
    }
  };
  const { pageId } = useParams<ExplorerURLParams>();

  return (
    <>
      <CloseEditor />
      <Form>
        <FormRow className="form-row-header">
          <NameWrapper className="t--nameOfApi">
            <JSActionNameEditor page="JS_PANE" />
          </NameWrapper>
          <ActionButtons className="t--formActionButtons">
            <MoreJSActionsMenu
              className="t--more-action-menu"
              id={currentJSAction ? currentJSAction.id : ""}
              name={currentJSAction ? currentJSAction.name : ""}
              pageId={pageId}
            />
            <Button
              className="t--apiFormRunBtn"
              isLoading={false}
              size={Size.medium}
              tag="button"
              text="Run"
              type="button"
            />
          </ActionButtons>
        </FormRow>
        <SecondaryWrapper>
          <TabContainerView>
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
                      height={"400px"}
                      input={{
                        value: currentJSAction?.body,
                        onChange: (event: any) => handleOnChange(event),
                      }}
                      mode={EditorModes.JAVASCRIPT}
                      placeholder="code goes here"
                      showLightningMenu={false}
                      showLineNumbers
                      size={EditorSize.EXTENDED}
                      tabBehaviour={TabBehaviour.INDENT}
                      theme={theme}
                    />
                  ),
                },
              ]}
            />
          </TabContainerView>
          <TabbedViewContainer ref={panelRef}>
            <Resizable panelRef={panelRef} />
            <TabComponent
              onSelect={onTabSelect}
              selectedIndex={selectedIndex}
              tabs={responseTabs}
            />
          </TabbedViewContainer>
        </SecondaryWrapper>
      </Form>
    </>
  );
}

export default reduxForm<JSAction, Props>({
  form: JS_EDITOR_FORM,
})(JSEditorForm);
