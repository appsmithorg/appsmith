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
import {
  isPathADynamicProperty,
  isPathADynamicTrigger,
} from "../../../utils/DynamicBindingUtils";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import { OnboardingStep } from "constants/OnboardingConstants";
import Indicator from "components/editorComponents/Onboarding/Indicator";

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
    const dataTreePath: any = `${widgetProperties.widgetName}.evaluatedValues.${propertyName}`;
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
      expected: FIELD_EXPECTED_VALUE[widgetProperties.type][
        propertyName
      ] as any,
    };
    if (isPathADynamicTrigger(widgetProperties, propertyName)) {
      config.isValid = true;
      config.validationMessage = "";
      delete config.dataTreePath;
      delete config.evaluatedValue;
      delete config.expected;
    }

    const isDynamic: boolean = isPathADynamicProperty(
      widgetProperties,
      propertyName,
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
          <Boxed
            step={OnboardingStep.DEPLOY}
            show={
              propertyName !== "isRequired" && propertyName !== "isDisabled"
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
                  className={`t--js-toggle ${isDynamic ? "is-active" : ""}`}
                >
                  <ControlIcons.JS_TOGGLE />
                </JSToggleButton>
              )}
            </ControlPropertyLabelContainer>
            <Indicator
              step={OnboardingStep.ADD_INPUT_WIDGET}
              show={propertyName === "onSubmit"}
            >
              {PropertyControlFactory.createControl(
                config,
                {
                  onPropertyChange: onPropertyChange,
                },
                isDynamic,
              )}
            </Indicator>
          </Boxed>
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
