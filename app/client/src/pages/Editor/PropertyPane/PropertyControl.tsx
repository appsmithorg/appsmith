import React, { useCallback } from "react";
import _ from "lodash";
import {
  ControlPropertyLabelContainer,
  ControlWrapper,
  JSToggleButton,
} from "components/propertyControls/StyledControls";
import { ControlIcons } from "icons/ControlIcons";
import PropertyControlFactory from "utils/PropertyControlFactory";
import { WidgetProps } from "widgets/BaseWidget";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import FIELD_EXPECTED_VALUE from "constants/FieldExpectedValue";
import { useDispatch } from "react-redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  setWidgetDynamicProperty,
  updateWidgetPropertyRequest,
} from "actions/controlActions";
import { RenderModes } from "constants/WidgetConstants";
import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";

type Props = {
  widgetProperties: WidgetProps;
  propertyConfig: PropertyPaneControlConfig;
};

const PropertyControl = (props: Props) => {
  const dispatch = useDispatch();
  const { widgetProperties, propertyConfig } = props;

  const toggleDynamicProperty = useCallback(
    (propertyName: string, isDynamic: boolean) => {
      AnalyticsUtil.logEvent("WIDGET_TOGGLE_JS_PROP", {
        widgetType: widgetProperties.type,
        widgetName: widgetProperties.widgetName,
        propertyName: propertyName,
        propertyState: !isDynamic ? "JS" : "NORMAL",
      });
      dispatch(
        setWidgetDynamicProperty(
          widgetProperties.widgetId,
          propertyName,
          isDynamic,
        ),
      );
    },
    [
      dispatch,
      widgetProperties.widgetId,
      widgetProperties.type,
      widgetProperties.widgetName,
    ],
  );
  const onPropertyChange = useCallback(
    (propertyName: string, propertyValue: string) => {
      AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE", {
        widgetType: widgetProperties.type,
        widgetName: widgetProperties.widgetName,
        propertyName: propertyName,
        updatedValue: propertyValue,
      });
      dispatch(
        updateWidgetPropertyRequest(
          widgetProperties.widgetId,
          propertyName,
          propertyValue,
          RenderModes.CANVAS, // This seems to be not needed anymore.
        ),
      );
    },
    [
      dispatch,
      widgetProperties.widgetId,
      widgetProperties.type,
      widgetProperties.widgetName,
    ],
  );
  // Do not render the control if it needs to be hidden
  if (
    props.propertyConfig.hidden &&
    props.propertyConfig.hidden(props.widgetProperties)
  ) {
    return null;
  }

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
