import React from "react";
import _ from "lodash";
import { CONVERTIBLE_CONTROLS } from "constants/PropertyControlConstants";
import {
  ControlPropertyLabelContainer,
  ControlWrapper,
  JSToggleButton,
} from "components/propertyControls/StyledControls";
import { ControlIcons } from "icons/ControlIcons";
import PropertyControlFactory from "utils/PropertyControlFactory";
import { WidgetProps } from "widgets/BaseWidget";
import { ControlConfig } from "reducers/entityReducers/propertyPaneConfigReducer";

type Props = {
  widgetProperties: WidgetProps;
  propertyConfig: ControlConfig;
  toggleDynamicProperty: (propertyName: string, isDynamic: boolean) => void;
  onPropertyChange: (propertyName: string, propertyValue: any) => void;
};

const PropertyControl = (props: Props) => {
  const {
    widgetProperties,
    propertyConfig,
    toggleDynamicProperty,
    onPropertyChange,
  } = props;

  const getPropertyValidation = (
    propertyName: string,
  ): { isValid: boolean; validationMessage?: string } => {
    let isValid = true;
    let validationMessage = "";
    if (widgetProperties) {
      isValid = widgetProperties.invalidProps
        ? !(propertyName in widgetProperties.invalidProps)
        : true;
      validationMessage = widgetProperties.validationMessages
        ? propertyName in widgetProperties.validationMessages
          ? widgetProperties.validationMessages[propertyName]
          : ""
        : "";
    }
    return { isValid, validationMessage };
  };

  const { propertyName, label } = propertyConfig;
  if (widgetProperties) {
    const propertyValue = widgetProperties[propertyName];
    const validation = getPropertyValidation(propertyName);
    const config = { ...propertyConfig, ...validation, propertyValue };
    const isDynamic: boolean = _.get(
      widgetProperties,
      ["dynamicProperties", propertyName],
      false,
    );
    const isConvertible = CONVERTIBLE_CONTROLS.indexOf(config.controlType) > -1;
    return (
      <ControlWrapper
        key={config.key}
        orientation={
          config.controlType === "SWITCH" && !isDynamic
            ? "HORIZONTAL"
            : "VERTICAL"
        }
      >
        <ControlPropertyLabelContainer>
          <label>{label}</label>
          {isConvertible && (
            <JSToggleButton
              active={isDynamic}
              onClick={() => toggleDynamicProperty(propertyName, isDynamic)}
            >
              <ControlIcons.JS_TOGGLE />
            </JSToggleButton>
          )}
        </ControlPropertyLabelContainer>
        {PropertyControlFactory.createControl(
          config,
          {
            onPropertyChange: onPropertyChange,
          },
          isDynamic,
        )}
      </ControlWrapper>
    );
  }
  return null;
};

export default PropertyControl;
