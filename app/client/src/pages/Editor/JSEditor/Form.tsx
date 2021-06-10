import React, { useState } from "react";
import styled from "styled-components";
import { JS_EDITOR_FORM } from "constants/forms";
import { Action } from "entities/Action";
import CloseEditor from "components/editorComponents/CloseEditor";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import FormRow from "components/editorComponents/FormRow";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
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
const StyledFormRow = styled(FormRow)`
  padding: 0px 24px;
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
const ActionButtons = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }
`;
const MainConfiguration = styled.div`
  height: auto;
  border-bottom: 1px solid #e8e8e8;
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
      background-color: ${(props) => props.theme.colors.apiPane.bg};
    }
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
  jsAction: Action | undefined;
}

type Props = JSFormProps;

function JSEditorForm(props: Props) {
  const theme = EditorTheme.LIGHT;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { jsAction } = props;
  const body = jsAction?.actionConfiguration?.body;
  return (
    <Form>
      <MainConfiguration>
        <StyledFormRow className="form-row-header">
          <NameWrapper className="t--nameOfApi">
            <CloseEditor />
            <ActionNameEditor />
          </NameWrapper>
          <ActionButtons className="t--formActionButtons">
            <MoreActionsMenu
              className="t--more-action-menu"
              id={""}
              name={""}
              pageId={""}
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
      </MainConfiguration>
      <TabbedViewContainer>
        <TabComponent
          onSelect={setSelectedIndex}
          selectedIndex={selectedIndex}
          tabs={[
            {
              key: "code",
              title: "Code",
              panelComponent: (
                <CodeEditor
                  className={"js-editor"}
                  input={{
                    value: body,
                    onChange: () => {
                      //change code goes here
                    },
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
                    actionSettingsConfig={[]}
                    formName={JS_EDITOR_FORM}
                    theme={theme}
                  />
                </SettingsWrapper>
              ),
            },
          ]}
        />
      </TabbedViewContainer>
    </Form>
  );
}

export default reduxForm<Action, Props>({
  form: JS_EDITOR_FORM,
})(JSEditorForm);
