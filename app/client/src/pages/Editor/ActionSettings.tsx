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

function ActionSettings(props: ActionSettingsProps): JSX.Element {
  return (
    <>
      {props.actionSettingsConfig.map((section: any) =>
        renderEachConfig(section, props.formName),
      )}
    </>
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
