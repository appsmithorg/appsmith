import React from "react";
import _ from "lodash";
import {
  ControlPropertyLabelContainer,
  ControlWrapper,
  JSToggleButton,
} from "components/propertyControls/StyledControls";
import { ControlIcons } from "icons/ControlIcons";
import PropertyControlFactory from "utils/PropertyControlFactory";
import { WidgetProps } from "widgets/BaseWidget";
import { PropertyControlPropsType } from "components/propertyControls";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import FIELD_EXPECTED_VALUE from "constants/FieldExpectedValue";

type Props = {
  widgetProperties: WidgetProps;
  propertyConfig: PropertyControlPropsType;
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
    const dataTreePath = `${widgetProperties.widgetName}.evaluatedValues.${propertyName}`;
    const evaluatedValue = _.get(
      widgetProperties,
      `evaluatedValues.${propertyName}`,
    );
    const { isValid, validationMessage } = getPropertyValidation(propertyName);
    const config = {
      ...propertyConfig,
      isValid,
      propertyValue,
      validationMessage,
      dataTreePath,
      evaluatedValue,
      widgetProperties: widgetProperties,
      expected: FIELD_EXPECTED_VALUE[widgetProperties.type][propertyName],
    };
    if (
      widgetProperties.dynamicTriggers &&
      widgetProperties.dynamicTriggers[propertyName]
    ) {
      config.isValid = true;
      config.validationMessage = "";
      delete config.dataTreePath;
      delete config.evaluatedValue;
      delete config.expected;
    }

    const isDynamic: boolean = _.get(
      widgetProperties,
      ["dynamicProperties", propertyName],
      false,
    );
    const isConvertible = !!propertyConfig.isJSConvertible;
    const className = propertyConfig.label
      .split(" ")
      .join("")
      .toLowerCase();
    try {
      return (
        <ControlWrapper
          className={`t--property-control-${className}`}
          key={config.id}
          orientation={
            config.controlType === "SWITCH" && !isDynamic
              ? "HORIZONTAL"
              : "VERTICAL"
          }
        >
          <ControlPropertyLabelContainer>
            <PropertyHelpLabel
              tooltip={propertyConfig.helpText}
              label={label}
            />
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
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  return null;
};

export default PropertyControl;
