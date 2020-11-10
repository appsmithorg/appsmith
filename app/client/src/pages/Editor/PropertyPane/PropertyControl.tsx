import React, { memo, useCallback } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  setWidgetDynamicProperty,
  updateWidgetPropertyRequest,
} from "actions/controlActions";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import { IPanelProps } from "@blueprintjs/core";
import PanelPropertiesEditor from "./PanelPropertiesEditor";
import {
  isPathADynamicProperty,
  isPathADynamicTrigger,
} from "../../../utils/DynamicBindingUtils";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";

type Props = PropertyPaneControlConfig & {
  panel: IPanelProps;
};

const PropertyControl = memo((props: Props) => {
  const dispatch = useDispatch();
  const widgetProperties: any = useSelector(getWidgetPropsForPropertyPane);

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
          !isDynamic,
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
    (propertyName: string, propertyValue: any) => {
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

  const openPanel = useCallback(
    (panelProps: any) => {
      if (props.panelConfig) {
        props.panel.openPanel({
          component: PanelPropertiesEditor,
          props: {
            panelProps,
            panelConfig: props.panelConfig,
            onPropertyChange: onPropertyChange,
            panelParentPropertyPath: props.propertyName,
            panel: props.panel,
          },
        });
      }
    },
    [props.panelConfig, onPropertyChange, props.propertyName],
  );

  // Do not render the control if it needs to be hidden
  if (props.hidden && props.hidden(widgetProperties)) {
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
    const propertyValue = _.get(widgetProperties, propertyName);
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
      expected: FIELD_EXPECTED_VALUE[widgetProperties.type as WidgetType][
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
                className={`t--js-toggle ${isDynamic ? "is-active" : ""}`}
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
});

PropertyControl.displayName = "PropertyControl";

(PropertyControl as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default PropertyControl;
