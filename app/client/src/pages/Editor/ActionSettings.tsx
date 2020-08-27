import React from "react";
import FormControlFactory from "utils/FormControlFactory";
import { ControlProps } from "components/formControls/BaseControl";

interface ActionSettingsProps {
  actionSettingsConfig: any;
}

const ActionSettings = (props: ActionSettingsProps): JSX.Element => {
  return <>{props.actionSettingsConfig.map(renderEachConfig)}</>;
};

const renderEachConfig = (section: any): any => {
  return section.children.map((propertyControlOrSection: ControlProps) => {
    if ("children" in propertyControlOrSection) {
      return renderEachConfig(propertyControlOrSection);
    } else {
      try {
        const { configProperty } = propertyControlOrSection;
        return (
          <div key={configProperty} style={{ marginTop: "18px" }}>
            {FormControlFactory.createControl(
              { ...propertyControlOrSection },
              {},
              false,
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
