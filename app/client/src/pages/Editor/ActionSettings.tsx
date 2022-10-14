import React from "react";
import { ControlProps } from "components/formControls/BaseControl";
import FormControl from "./FormControl";
import log from "loglevel";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import styled from "styled-components";

interface ActionSettingsProps {
  actionSettingsConfig: any;
  formName: string;
  theme?: EditorTheme;
}

const FormRow = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[10] + 1}px;
`;

const ActionSettingsWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  padding-bottom: 1px;
  .form-config-top {
    flex-grow: 1;
  }
  .t--form-control-INPUT_TEXT > div {
    width: 520px !important;
  }
  .t--form-control-SWITCH {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    margin-left: 24px;
  }
  &&& .bp3-control.bp3-switch .bp3-control-indicator {
    width: 46px;
    height: 24px;
    position: relative;
  }
  &&& .bp3-control.bp3-switch .bp3-control-indicator::before {
    width: 20px;
    height: 20px;
  }
  &&& .bp3-control.bp3-switch input:checked ~ .bp3-control-indicator::before {
    left: calc(100% - 24px);
  }
`;

function ActionSettings(props: ActionSettingsProps): JSX.Element {
  return (
    <ActionSettingsWrapper>
      {props.actionSettingsConfig.map((section: any) =>
        renderEachConfig(section, props.formName),
      )}
    </ActionSettingsWrapper>
  );
}

const renderEachConfig = (section: any, formName: string): any => {
  return section.children.map((formControlOrSection: ControlProps) => {
    if ("children" in formControlOrSection) {
      return renderEachConfig(formControlOrSection, formName);
    } else {
      try {
        const { configProperty } = formControlOrSection;
        return (
          <FormRow key={configProperty}>
            <FormControl config={formControlOrSection} formName={formName} />
          </FormRow>
        );
      } catch (e) {
        log.error(e);
      }
    }
    return null;
  });
};

export default ActionSettings;
