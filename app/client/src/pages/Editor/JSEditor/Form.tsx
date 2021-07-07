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
import ActionSettings from "pages/Editor/ActionSettings";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import Resizable from "components/editorComponents/Debugger/Resizer";
import {
  TabbedViewContainer,
  TabContainerView,
  SecondaryWrapper,
  StyledFormRow,
} from "../QueryEditor/EditorJSONtoForm";
import JSActionNameEditor from "./JSActionNameEditor";
import { updateJSAction } from "actions/jsPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../Explorer/helpers";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 0 0 0;
  width: 100%;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
  background-color: ${(props) => props.theme.colors.apiPane.bg};
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

const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
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
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }
`;

const SettingsWrapper = styled.div`
  padding: 16px 30px;
  height: 100%;
  ${FormLabel} {
    padding: 0px;
  }
`;
interface JSFormProps {
  jsAction: JSAction | undefined;
  settingsConfig: any;
}

type Props = JSFormProps;

function JSEditorForm(props: Props) {
  const theme = EditorTheme.LIGHT;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mainTabIndex, setMainTabIndex] = useState(0);
  const { jsAction } = props;
  const body = jsAction?.body;
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
  const params = useParams<{ functionId: string }>();

  const jsActions: JSAction[] = useSelector((state: AppState) =>
    state.entities.jsActions.map((js) => js.config),
  );
  const currentJSAction: JSAction | undefined = jsActions.find(
    (js) => js.id === params.functionId,
  );

  const handleOnChange = (event: string) => {
    dispatch(updateJSAction(event));
  };
  const { pageId } = useParams<ExplorerURLParams>();

  return (
    <Form>
      <StyledFormRow className="form-row-header">
        <NameWrapper className="t--nameOfApi">
          <CloseEditor />
          <JSActionNameEditor />
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
      </StyledFormRow>
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
                    input={{
                      value: body,
                      onChange: (event: any) => handleOnChange(event),
                    }}
                    mode={EditorModes.JAVASCRIPT}
                    placeholder="code goes here"
                    showLightningMenu={false}
                    showLineNumbers
                    size={EditorSize.EXTENDED}
                    tabBehaviour={TabBehaviour.INPUT}
                    theme={theme}
                  />
                ),
              },
              {
                key: "settings",
                title: "Settings",
                panelComponent: (
                  <SettingsWrapper>
                    <ActionSettings
                      actionSettingsConfig={props.settingsConfig}
                      formName={JS_EDITOR_FORM}
                      theme={theme}
                    />
                  </SettingsWrapper>
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
  );
}

export default reduxForm<JSAction, Props>({
  form: JS_EDITOR_FORM,
})(JSEditorForm);
