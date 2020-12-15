import React from "react";
import { ControlProps } from "components/formControls/BaseControl";
import FormControl from "./FormControl";

interface ActionSettingsProps {
  actionSettingsConfig: any;
  formName: string;
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
          <div key={configProperty} style={{ marginTop: "18px" }}>
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
