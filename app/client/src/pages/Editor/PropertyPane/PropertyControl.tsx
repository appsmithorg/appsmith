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
import { Tooltip, Position } from "@blueprintjs/core";
import FIELD_EXPECTED_VALUE from "constants/FieldExpectedValue";

type Props = {
  widgetProperties: WidgetProps;
  propertyConfig: PropertyControlPropsType;
  toggleDynamicProperty: (propertyName: string, isDynamic: boolean) => void;
  onPropertyChange: (propertyName: string, propertyValue: any) => void;
};

function UnderlinedLabel({
  tooltip,
  label,
}: {
  tooltip?: string;
  label: string;
}) {
  const toolTipDefined = tooltip !== undefined;
  return (
    <Tooltip
      disabled={!toolTipDefined}
      content={tooltip}
      position={Position.TOP}
      hoverOpenDelay={200}
    >
      <div
        style={{
          height: "22px",
        }}
      >
        <label
          style={
            toolTipDefined
              ? {
                  cursor: "help",
                }
              : {}
          }
          className={`t--property-control-label`}
        >
          {label}
        </label>
        <span
          className={"underline"}
          style={
            toolTipDefined
              ? {
                  borderBottom: "1px dashed",
                  width: "100%",
                  display: "inline-block",
                  position: "relative",
                  top: "-15px",
                }
              : {}
          }
        />
      </div>
    </Tooltip>
  );
}

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
    const { isValid, validationMessage } = getPropertyValidation(propertyName);
    const config = {
      ...propertyConfig,
      isValid,
      propertyValue,
      validationMessage,
      dataTreePath,
      expected: FIELD_EXPECTED_VALUE[widgetProperties.type][propertyName],
    };
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
            <UnderlinedLabel tooltip={propertyConfig.helpText} label={label} />

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
