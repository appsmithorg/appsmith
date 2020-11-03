import React, { useCallback } from "react";
import _ from "lodash";
import {
  ControlPropertyLabelContainer,
  ControlWrapper,
  JSToggleButton,
} from "components/propertyControls/StyledControls";
import { ControlIcons } from "icons/ControlIcons";
import PropertyControlFactory from "utils/PropertyControlFactory";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import FIELD_EXPECTED_VALUE from "constants/FieldExpectedValue";
import { useDispatch } from "react-redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  setWidgetDynamicProperty,
  updateWidgetPropertyRequest,
} from "actions/controlActions";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import { IPanelProps } from "@blueprintjs/core";
import PanelPropertiesEditor from "./PanelPropertiesEditor";
import produce from "immer";

type Props = PropertyPaneControlConfig & {
  panel: IPanelProps;
  widgetProperties: any;
  onPropertyChange?: (propertyName: string, propertyValue: any) => void;
};

const PropertyControl = (props: Props) => {
  const dispatch = useDispatch();
  const { widgetProperties } = props;

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

  let onPropertyChange = useCallback(
    (propertyName: string, propertyValue: any) => {
      AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE", {
        widgetType: widgetProperties.type,
        widgetName: widgetProperties.widgetName,
        propertyName: propertyName,
        updatedValue: propertyValue,
      });
      let value = propertyValue;
      let key = propertyName;
      if (props.panelConfig && propertyName.split(".").length > 1) {
        const panelConfig = props.panelConfig;
        const paths = propertyName.split(".");
        console.log(
          props.widgetProperties,
          props.propertyName,
          props.widgetProperties[props.propertyName],
          paths,
        );
        const ind = props.widgetProperties[props.propertyName].findIndex(
          (entry: any) => {
            return entry[panelConfig.panelIdPropertyName] === paths[0];
          },
        );
        key = props.propertyName;
        value = produce(
          props.widgetProperties[props.propertyName],
          (list: any) => {
            if (list[ind] && list[ind][paths[1]]) {
              list[ind][paths[1]] = propertyValue;
            }
          },
        );
      }

      dispatch(
        updateWidgetPropertyRequest(
          widgetProperties.widgetId,
          key,
          value,
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

  if (props.onPropertyChange) onPropertyChange = props.onPropertyChange;

  const openPanel = useCallback(
    (panelProps: any) => {
      if (props.panelConfig) {
        props.panel.openPanel({
          component: PanelPropertiesEditor,
          props: {
            panelProps,
            panelConfig: props.panelConfig,
            onPropertyChange: onPropertyChange,
          },
        });
      }
    },
    [props.panelConfig, widgetProperties],
  );
  // Do not render the control if it needs to be hidden
  if (props.hidden && props.hidden(props.widgetProperties)) {
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

  const { propertyName, label } = props;
  if (widgetProperties) {
    const propertyValue = widgetProperties[propertyName];
    const dataTreePath: any = `${widgetProperties.widgetName}.evaluatedValues.${propertyName}`;
    const evaluatedValue = _.get(
      widgetProperties,
      `evaluatedValues.${propertyName}`,
    );
    const { isValid, validationMessage } = getPropertyValidation(propertyName);
    const config = {
      ...props,
      isValid,
      propertyValue,
      validationMessage,
      dataTreePath,
      evaluatedValue,
      widgetProperties,
      parentPropertyName: propertyName,
      parentPropertyValue: propertyValue,
      expected: FIELD_EXPECTED_VALUE[props.widgetProperties.type as WidgetType][
        propertyName
      ] as any,
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
    const isConvertible = !!props.isJSConvertible;
    const className = props.label
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
            <PropertyHelpLabel tooltip={props.helpText} label={label} />
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
              openNextPanel: openPanel,
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
