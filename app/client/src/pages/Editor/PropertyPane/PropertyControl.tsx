import React, { memo, useCallback } from "react";
import _, { get } from "lodash";
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
  deleteWidgetProperty,
  batchUpdateWidgetProperty,
} from "actions/controlActions";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import { IPanelProps } from "@blueprintjs/core";
import PanelPropertiesEditor from "./PanelPropertiesEditor";
import {
  getEvalValuePath,
  isPathADynamicProperty,
  isPathADynamicTrigger,
} from "utils/DynamicBindingUtils";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import { OnboardingStep } from "constants/OnboardingConstants";
import Indicator from "components/editorComponents/Onboarding/Indicator";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";

import {
  useChildWidgetEnhancementFns,
  useParentWithEnhancementFn,
} from "sagas/WidgetEnhancementHelpers";
import { ControlData } from "components/propertyControls/BaseControl";

type Props = PropertyPaneControlConfig & {
  panel: IPanelProps;
  theme: EditorTheme;
};

const PropertyControl = memo((props: Props) => {
  const dispatch = useDispatch();
  const widgetProperties: any = useSelector(getWidgetPropsForPropertyPane);
  const parentWithEnhancement = useParentWithEnhancementFn(
    widgetProperties.widgetId,
  );

  /** get all child enhancements functions */
  const {
    autoCompleteEnhancementFn: childWidgetAutoCompleteEnhancementFn,
    customJSControlEnhancementFn: childWidgetCustomJSControlEnhancementFn,
    hideEvaluatedValueEnhancementFn: childWidgetHideEvaluatedValueEnhancementFn,
    propertyPaneEnhancementFn: childWidgetPropertyUpdateEnhancementFn,
    updateDataTreePathFn: childWidgetDataTreePathEnhancementFn,
  } = useChildWidgetEnhancementFns(widgetProperties.widgetId);

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

  const onDeleteProperties = useCallback(
    (propertyPaths: string[]) => {
      dispatch(deleteWidgetProperty(widgetProperties.widgetId, propertyPaths));
    },
    [dispatch, widgetProperties.widgetId],
  );
  const onBatchUpdateProperties = useCallback(
    (allUpdates: Record<string, unknown>) =>
      dispatch(
        batchUpdateWidgetProperty(widgetProperties.widgetId, {
          modify: allUpdates,
        }),
      ),
    [widgetProperties.widgetId, dispatch],
  );
  // this function updates the properties of widget passed
  const onBatchUpdatePropertiesOfWidget = useCallback(
    (
      allUpdates: Record<string, unknown>,
      widgetId: string,
      triggerPaths: string[],
    ) => {
      dispatch(
        batchUpdateWidgetProperty(widgetId, {
          modify: allUpdates,
          triggerPaths,
        }),
      );
    },
    [dispatch],
  );

  /**
   * this function is called whenever we change any property in the property pane
   * it updates the widget property by updateWidgetPropertyRequest
   * It also calls the beforeChildPropertyUpdate hook
   */
  const onPropertyChange = useCallback(
    (propertyName: string, propertyValue: any) => {
      AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE", {
        widgetType: widgetProperties.type,
        widgetName: widgetProperties.widgetName,
        propertyName: propertyName,
        updatedValue: propertyValue,
      });
      let propertiesToUpdate:
        | Array<{
            propertyPath: string;
            propertyValue: any;
          }>
        | undefined;
      if (props.updateHook) {
        propertiesToUpdate = props.updateHook(
          widgetProperties,
          propertyName,
          propertyValue,
        );
      }

      // if there are enhancements related to the widget, calling them here
      // enhancements are basically group of functions that are called before widget propety
      // is changed on propertypane. For e.g - set/update parent property
      if (childWidgetPropertyUpdateEnhancementFn) {
        const hookPropertiesUpdates = childWidgetPropertyUpdateEnhancementFn(
          widgetProperties.widgetName,
          propertyName,
          propertyValue,
          props.isTriggerProperty,
        );

        if (
          Array.isArray(hookPropertiesUpdates) &&
          hookPropertiesUpdates.length > 0
        ) {
          const allUpdates: Record<string, unknown> = {};
          const triggerPaths: string[] = [];
          hookPropertiesUpdates.forEach(
            ({ isDynamicTrigger, propertyPath, propertyValue }) => {
              allUpdates[propertyPath] = propertyValue;
              if (isDynamicTrigger) triggerPaths.push(propertyPath);
            },
          );

          onBatchUpdatePropertiesOfWidget(
            allUpdates,
            get(parentWithEnhancement, "widgetId", ""),
            triggerPaths,
          );
        }
      }

      if (propertiesToUpdate) {
        const allUpdates: Record<string, unknown> = {};
        propertiesToUpdate.forEach(({ propertyPath, propertyValue }) => {
          allUpdates[propertyPath] = propertyValue;
        });
        allUpdates[propertyName] = propertyValue;
        onBatchUpdateProperties(allUpdates);
        AppsmithConsole.info({
          logType: LOG_TYPE.WIDGET_UPDATE,
          text: "Widget properties were updated",
          source: {
            type: ENTITY_TYPE.WIDGET,
            name: widgetProperties.widgetName,
            id: widgetProperties.widgetId,
            // TODO: Check whether these properties have
            // dependent properties
            propertyPath: propertiesToUpdate[0].propertyPath,
          },
          state: allUpdates,
        });
      }
      if (!propertiesToUpdate) {
        dispatch(
          updateWidgetPropertyRequest(
            widgetProperties.widgetId,
            propertyName,
            propertyValue,
            RenderModes.CANVAS, // This seems to be not needed anymore.
          ),
        );
        AppsmithConsole.info({
          logType: LOG_TYPE.WIDGET_UPDATE,
          text: "Widget properties were updated",
          source: {
            type: ENTITY_TYPE.WIDGET,
            name: widgetProperties.widgetName,
            id: widgetProperties.widgetId,
            propertyPath: propertyName,
          },
          state: {
            [propertyName]: propertyValue,
          },
        });
      }
    },
    [dispatch, widgetProperties],
  );

  const openPanel = useCallback(
    (panelProps: any) => {
      if (props.panelConfig) {
        props.panel.openPanel({
          component: PanelPropertiesEditor,
          props: {
            panelProps,
            panelConfig: props.panelConfig,
            onPropertiesChange: onBatchUpdateProperties,
            panelParentPropertyPath: props.propertyName,
            panel: props.panel,
            theme: props.theme,
          },
        });
      }
    },
    [props.panelConfig, onPropertyChange, props.propertyName],
  );

  // Do not render the control if it needs to be hidden
  if (props.hidden && props.hidden(widgetProperties, props.propertyName)) {
    return null;
  }

  const { label, propertyName } = props;
  if (widgetProperties) {
    const propertyValue = _.get(widgetProperties, propertyName);
    // get the dataTreePath and apply enhancement if exists
    let dataTreePath: string =
      props.dataTreePath || `${widgetProperties.widgetName}.${propertyName}`;
    if (childWidgetDataTreePathEnhancementFn) {
      dataTreePath = childWidgetDataTreePathEnhancementFn(dataTreePath);
    }

    const evaluatedValue = _.get(
      widgetProperties,
      getEvalValuePath(dataTreePath, false),
    );

    const { additionalAutoComplete, ...rest } = props;
    const config: ControlData = {
      ...rest,
      propertyValue,
      dataTreePath,
      evaluatedValue,
      widgetProperties,
      parentPropertyName: propertyName,
      parentPropertyValue: propertyValue,
      expected: FIELD_EXPECTED_VALUE[widgetProperties.type as WidgetType][
        propertyName
      ] as any,
      additionalDynamicData: {},
    };
    if (isPathADynamicTrigger(widgetProperties, propertyName)) {
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

    let additionAutocomplete = undefined;
    if (additionalAutoComplete) {
      additionAutocomplete = additionalAutoComplete(widgetProperties);
    } else if (childWidgetAutoCompleteEnhancementFn) {
      additionAutocomplete = childWidgetAutoCompleteEnhancementFn();
    }

    /**
     * if the current widget requires a customJSControl, use that.
     */
    const getCustomJSControl = () => {
      if (childWidgetCustomJSControlEnhancementFn) {
        return childWidgetCustomJSControlEnhancementFn();
      }

      return props.customJSControl;
    };

    /**
     * should the property control hide evaluated popover
     * @returns
     */
    const hideEvaluatedValue = () => {
      if (childWidgetHideEvaluatedValueEnhancementFn) {
        return childWidgetHideEvaluatedValueEnhancementFn();
      }

      return false;
    };

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
            show={
              propertyName !== "isRequired" && propertyName !== "isDisabled"
            }
            step={OnboardingStep.DEPLOY}
          >
            <ControlPropertyLabelContainer>
              <PropertyHelpLabel
                label={label}
                theme={props.theme}
                tooltip={props.helpText}
              />
              {isConvertible && (
                <JSToggleButton
                  active={isDynamic}
                  className={`t--js-toggle ${isDynamic ? "is-active" : ""}`}
                  onClick={() => toggleDynamicProperty(propertyName, isDynamic)}
                >
                  <ControlIcons.JS_TOGGLE />
                </JSToggleButton>
              )}
            </ControlPropertyLabelContainer>
            <Indicator
              show={propertyName === "onSubmit"}
              step={OnboardingStep.ADD_INPUT_WIDGET}
            >
              {PropertyControlFactory.createControl(
                config,
                {
                  onPropertyChange: onPropertyChange,
                  openNextPanel: openPanel,
                  deleteProperties: onDeleteProperties,
                  theme: props.theme,
                },
                isDynamic,
                getCustomJSControl(),
                additionAutocomplete,
                hideEvaluatedValue(),
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
});

PropertyControl.displayName = "PropertyControl";

(PropertyControl as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default PropertyControl;
