import React from "react";
import FormControlFactory from "utils/FormControlFactory";
import { ControlProps } from "components/formControls/BaseControl";

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
  return section.children.map((propertyControlOrSection: ControlProps) => {
    if ("children" in propertyControlOrSection) {
      return renderEachConfig(propertyControlOrSection, formName);
    } else {
      try {
        const { configProperty } = propertyControlOrSection;
        return (
          <div key={configProperty} style={{ marginTop: "18px" }}>
            {FormControlFactory.createControl(
              { ...propertyControlOrSection },
              formName,
            )}
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
