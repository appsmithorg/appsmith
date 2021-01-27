import React from "react";
import { ControlProps } from "components/formControls/BaseControl";
import FormControl from "./FormControl";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

interface ActionSettingsProps {
  actionSettingsConfig: any;
  formName: string;
  theme?: EditorTheme;
}

const ActionSettings = (props: ActionSettingsProps): JSX.Element => {
  return (
    <>
      {props.actionSettingsConfig.map((section: any) =>
        renderEachConfig(section, props.formName),
      )}
    </>
  );
};

const renderEachConfig = (section: any, formName: string): any => {
  return section.children.map((formControlOrSection: ControlProps) => {
    if ("children" in formControlOrSection) {
      return renderEachConfig(formControlOrSection, formName);
    } else {
      try {
        const { configProperty } = formControlOrSection;
        return (
          <div key={configProperty} style={{ marginBottom: "25px" }}>
            <FormControl config={formControlOrSection} formName={formName} />
          </div>
        );
      } catch (e) {
        console.log(e);
      }
    }
    return null;
  });
};

export default ActionSettings;
