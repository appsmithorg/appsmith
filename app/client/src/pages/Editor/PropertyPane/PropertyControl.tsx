import React, { memo, useCallback } from "react";
import _, { get, isEqual } from "lodash";
import * as log from "loglevel";

import {
  ControlPropertyLabelContainer,
  ControlWrapper,
} from "components/propertyControls/StyledControls";
import { JSToggleButton } from "components/ads";
import PropertyControlFactory from "utils/PropertyControlFactory";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import { useDispatch, useSelector } from "react-redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  batchUpdateMultipleWidgetProperties,
  batchUpdateWidgetProperty,
  deleteWidgetProperty,
  setWidgetDynamicProperty,
  UpdateWidgetPropertyPayload,
} from "actions/controlActions";
import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import { IPanelProps } from "@blueprintjs/core";
import PanelPropertiesEditor from "./PanelPropertiesEditor";
import {
  getEvalValuePath,
  isDynamicValue,
  isPathADynamicProperty,
  isPathADynamicTrigger,
  THEME_BINDING_REGEX,
} from "utils/DynamicBindingUtils";
import {
  getWidgetPropsForPropertyName,
  WidgetProperties,
} from "selectors/propertyPaneSelectors";
import { getWidgetEnhancementSelector } from "selectors/widgetEnhancementSelectors";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { getExpectedValue } from "utils/validation/common";
import { ControlData } from "components/propertyControls/BaseControl";
import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { TooltipComponent } from "design-system";
import { ReactComponent as ResetIcon } from "assets/icons/control/undo_2.svg";
import { AppTheme } from "entities/AppTheming";
import { JS_TOGGLE_DISABLED_MESSAGE } from "@appsmith/constants/messages";

type Props = PropertyPaneControlConfig & {
  panel: IPanelProps;
  theme: EditorTheme;
};

const SHOULD_NOT_REJECT_DYNAMIC_BINDING_LIST_FOR = ["COLOR_PICKER"];

const PropertyControl = memo((props: Props) => {
  const dispatch = useDispatch();

  const propsSelector = getWidgetPropsForPropertyName(
    props.propertyName,
    props.dependencies,
    props.evaluatedDependencies,
  );

  const widgetProperties: WidgetProperties = useSelector(
    propsSelector,
    isEqual,
  );

  const enhancementSelector = getWidgetEnhancementSelector(
    widgetProperties.widgetId,
  );

  const { enhancementFns, parentIdWithEnhancementFn } = useSelector(
    enhancementSelector,
    isEqual,
  );

  const selectedTheme = useSelector(getSelectedAppTheme);

  /**
   * A property's stylesheet value can be fetched in 2 ways
   * 1. If a method is defined on the property config (getStylesheetValue), then
   *   it's the methods responsibility to resolve the stylesheet value.
   * 2. If no such method is defined, the value is assumed to be present in the
   *   theme config and thus it is fetched from there.
   */
  const propertyStylesheetValue = (() => {
    const widgetStylesheet: AppTheme["stylesheet"][string] = get(
      selectedTheme,
      `stylesheet.${widgetProperties.type}`,
    );

    if (props.getStylesheetValue) {
      return props.getStylesheetValue(
        widgetProperties,
        props.propertyName,
        widgetStylesheet,
      );
    }

    return get(widgetStylesheet, props.propertyName);
  })();

  const propertyValue = _.get(widgetProperties, props.propertyName);

  /**
   * checks if property value is deviated or not.
   * by deviation, we mean if value of property is same as
   * the one defined in the theme stylesheet. if values are different,
   * that means the property value is deviated from the theme stylesheet.
   */
  const isPropertyDeviatedFromTheme =
    typeof propertyStylesheetValue === "string" &&
    THEME_BINDING_REGEX.test(propertyStylesheetValue) &&
    propertyStylesheetValue !== propertyValue;

  /**
   * resets the value of property to theme stylesheet value
   * which is a binding to theme object defined in the stylesheet
   */
  const resetPropertyValueToTheme = () => {
    onPropertyChange(props.propertyName, propertyStylesheetValue);
  };

  const {
    autoCompleteEnhancementFn: childWidgetAutoCompleteEnhancementFn,
    customJSControlEnhancementFn: childWidgetCustomJSControlEnhancementFn,
    hideEvaluatedValueEnhancementFn: childWidgetHideEvaluatedValueEnhancementFn,
    propertyPaneEnhancementFn: childWidgetPropertyUpdateEnhancementFn,
    updateDataTreePathFn: childWidgetDataTreePathEnhancementFn,
  } = enhancementFns;

  const toggleDynamicProperty = useCallback(
    (propertyName: string, isDynamic: boolean) => {
      AnalyticsUtil.logEvent("WIDGET_TOGGLE_JS_PROP", {
        widgetType: widgetProperties?.type,
        widgetName: widgetProperties?.widgetName,
        propertyName: propertyName,
        propertyState: !isDynamic ? "JS" : "NORMAL",
      });

      let shouldRejectDynamicBindingPathList = true;

      // we don't want to remove the path from dynamic binding list
      // on toggling of js in case of few widgets
      if (
        SHOULD_NOT_REJECT_DYNAMIC_BINDING_LIST_FOR.includes(
          props.controlType,
        ) &&
        isDynamicValue(propertyValue)
      ) {
        shouldRejectDynamicBindingPathList = false;
      }

      dispatch(
        setWidgetDynamicProperty(
          widgetProperties?.widgetId,
          propertyName,
          !isDynamic,
          shouldRejectDynamicBindingPathList,
        ),
      );
    },
    [
      widgetProperties?.widgetId,
      widgetProperties?.type,
      widgetProperties?.widgetName,
    ],
  );

  const onDeleteProperties = useCallback(
    (propertyPaths: string[]) => {
      dispatch(deleteWidgetProperty(widgetProperties.widgetId, propertyPaths));
    },
    [widgetProperties.widgetId],
  );
  const onBatchUpdateProperties = useCallback(
    (allUpdates: Record<string, unknown>) =>
      dispatch(
        batchUpdateWidgetProperty(widgetProperties.widgetId, {
          modify: allUpdates,
        }),
      ),
    [widgetProperties.widgetId],
  );
  const onBatchUpdatePropertiesOfMultipleWidgets = useCallback(
    (updatesArray: UpdateWidgetPropertyPayload[]) => {
      dispatch(batchUpdateMultipleWidgetProperties(updatesArray));
    },
    [],
  );

  const getWidgetsOwnUpdatesOnPropertyChange = (
    propertyName: string,
    propertyValue: any,
  ) => {
    let propertiesToUpdate:
      | Array<{
          propertyPath: string;
          propertyValue: any;
        }>
      | undefined;
    // To support updating multiple properties of same widget.
    if (props.updateHook) {
      propertiesToUpdate = props.updateHook(
        widgetProperties,
        propertyName,
        propertyValue,
      );
    }
    if (propertiesToUpdate) {
      const allUpdates: Record<string, unknown> = {};
      propertiesToUpdate.forEach(({ propertyPath, propertyValue }) => {
        allUpdates[propertyPath] = propertyValue;
      });
      allUpdates[propertyName] = propertyValue;
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
      return {
        widgetId: widgetProperties.widgetId,
        updates: {
          modify: allUpdates,
        },
      };
    }
    if (!propertiesToUpdate) {
      const modify: Record<string, unknown> = {
        [propertyName]: propertyValue,
      };
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
      return {
        widgetId: widgetProperties.widgetId,
        updates: {
          modify,
        },
      };
    }
  };

  const getOtherWidgetPropertyChanges = (
    propertyName: string,
    propertyValue: any,
  ) => {
    let otherWidgetPropertiesToUpdates: UpdateWidgetPropertyPayload[] = [];

    // enhancements are one way to update property of another widget but will have leaks into the dsl
    // would recommend NOT TO FOLLOW this path for upcoming widgets.

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

        const parentEnhancementUpdates: UpdateWidgetPropertyPayload = {
          widgetId: parentIdWithEnhancementFn,
          updates: {
            modify: allUpdates,
            triggerPaths,
          },
        };
        otherWidgetPropertiesToUpdates.push(parentEnhancementUpdates);
      }
    }
    if (props.updateRelatedWidgetProperties) {
      const relatedWidgetUpdates = props.updateRelatedWidgetProperties(
        propertyName,
        propertyValue,
        widgetProperties,
      );
      if (Array.isArray(relatedWidgetUpdates) && relatedWidgetUpdates.length) {
        otherWidgetPropertiesToUpdates = otherWidgetPropertiesToUpdates.concat(
          relatedWidgetUpdates,
        );
      }
    }
    return otherWidgetPropertiesToUpdates;
  };

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

      const selfUpdates:
        | UpdateWidgetPropertyPayload
        | undefined = getWidgetsOwnUpdatesOnPropertyChange(
        propertyName,
        propertyValue,
      );
      const enhancementsToOtherWidgets: UpdateWidgetPropertyPayload[] = getOtherWidgetPropertyChanges(
        propertyName,
        propertyValue,
      );
      let allPropertiesToUpdates: UpdateWidgetPropertyPayload[] = [];
      if (selfUpdates) {
        allPropertiesToUpdates.push(selfUpdates);
        // ideally we should not allow updating another widget without any updates on its own.
        if (enhancementsToOtherWidgets && enhancementsToOtherWidgets.length) {
          allPropertiesToUpdates = allPropertiesToUpdates.concat(
            enhancementsToOtherWidgets,
          );
        }
      }
      if (allPropertiesToUpdates && allPropertiesToUpdates.length) {
        // updating properties of a widget(s) should be done only once when property value changes.
        // to make sure dsl updates are atomic which is a necessity for undo/redo.
        onBatchUpdatePropertiesOfMultipleWidgets(allPropertiesToUpdates);
      }
    },
    [widgetProperties],
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
  if (
    (props.hidden && props.hidden(widgetProperties, props.propertyName)) ||
    props.invisible
  ) {
    return null;
  }

  const { label, propertyName } = props;
  if (widgetProperties) {
    // get the dataTreePath and apply enhancement if exists
    let dataTreePath: string =
      props.dataTreePath || `${widgetProperties.widgetName}.${propertyName}`;
    if (childWidgetDataTreePathEnhancementFn) {
      dataTreePath = childWidgetDataTreePathEnhancementFn(
        dataTreePath,
      ) as string;
    }

    const evaluatedValue = _.get(
      widgetProperties,
      getEvalValuePath(dataTreePath, {
        isPopulated: true,
        fullPath: false,
      }),
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
      additionalDynamicData: {},
    };
    config.expected = getExpectedValue(props.validation);
    if (isPathADynamicTrigger(widgetProperties, propertyName)) {
      config.validationMessage = "";
      config.expected = {
        example: 'showAlert("There was an error!", "error")',
        type: "Function",
        autocompleteDataType: AutocompleteDataType.FUNCTION,
      };
      delete config.evaluatedValue;
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

    let additionAutocomplete:
      | Record<string, Record<string, unknown>>
      | undefined = undefined;
    if (additionalAutoComplete) {
      additionAutocomplete = additionalAutoComplete(widgetProperties);
    } else if (childWidgetAutoCompleteEnhancementFn) {
      additionAutocomplete = childWidgetAutoCompleteEnhancementFn() as
        | Record<string, Record<string, unknown>>
        | undefined;
    }

    /**
     * if the current widget requires a customJSControl, use that.
     */
    const getCustomJSControl = (): string | undefined => {
      if (childWidgetCustomJSControlEnhancementFn) {
        return childWidgetCustomJSControlEnhancementFn() as string | undefined;
      }

      return props.customJSControl;
    };

    /**
     * should the property control hide evaluated popover
     * @returns
     */
    const hideEvaluatedValue = (): boolean => {
      if (childWidgetHideEvaluatedValueEnhancementFn) {
        return childWidgetHideEvaluatedValueEnhancementFn() as boolean;
      }

      return false;
    };

    const uniqId = btoa(`${widgetProperties.widgetId}.${propertyName}`);
    const canDisplayValueInUI = PropertyControlFactory.controlUIToggleValidation.get(
      config.controlType,
    );

    const customJSControl = getCustomJSControl();

    let isToggleDisabled = false;
    if (
      isDynamic // JS toggle button is ON
    ) {
      if (
        // Check if value is not empty
        propertyValue !== undefined &&
        propertyValue !== ""
      ) {
        let value = propertyValue;
        // extract out the value from binding, if there is custom JS control (Table & JSONForm widget)
        if (customJSControl && isDynamicValue(value)) {
          const extractValue = PropertyControlFactory.inputComputedValueMap.get(
            customJSControl,
          );
          if (extractValue)
            value = extractValue(value, widgetProperties.widgetName);
        }

        // disable button if value can't be represented in UI mode
        if (!canDisplayValueInUI?.(config, value)) isToggleDisabled = true;
      }

      // Enable button if the value is same as the one defined in theme stylesheet.
      if (
        typeof propertyStylesheetValue === "string" &&
        THEME_BINDING_REGEX.test(propertyStylesheetValue) &&
        propertyStylesheetValue === propertyValue
      ) {
        isToggleDisabled = false;
      }
    }

    try {
      return (
        <ControlWrapper
          className={`t--property-control-${className} group`}
          data-guided-tour-iid={propertyName}
          id={uniqId}
          key={config.id}
          orientation={
            config.controlType === "SWITCH" && !isDynamic
              ? "HORIZONTAL"
              : "VERTICAL"
          }
        >
          <ControlPropertyLabelContainer className="gap-1">
            <PropertyHelpLabel
              label={label}
              theme={props.theme}
              tooltip={props.helpText}
            />
            {isConvertible && (
              <TooltipComponent
                content={JS_TOGGLE_DISABLED_MESSAGE}
                disabled={!isToggleDisabled}
                hoverOpenDelay={200}
                openOnTargetFocus={false}
                position="auto"
              >
                <JSToggleButton
                  handleClick={() =>
                    toggleDynamicProperty(propertyName, isDynamic)
                  }
                  isActive={isDynamic}
                  isToggleDisabled={isToggleDisabled}
                />
              </TooltipComponent>
            )}
            {isPropertyDeviatedFromTheme && (
              <>
                <TooltipComponent
                  content="Value deviated from theme"
                  openOnTargetFocus={false}
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                </TooltipComponent>
                <button
                  className="hidden ml-auto focus:ring-2 group-hover:block reset-button"
                  onClick={resetPropertyValueToTheme}
                >
                  <TooltipComponent
                    boundary="viewport"
                    content="Reset value"
                    openOnTargetFocus={false}
                    position="top-right"
                  >
                    <ResetIcon className="w-5 h-5" />
                  </TooltipComponent>
                </button>
              </>
            )}
          </ControlPropertyLabelContainer>
          {PropertyControlFactory.createControl(
            config,
            {
              onPropertyChange: onPropertyChange,
              onBatchUpdateProperties: onBatchUpdateProperties,
              openNextPanel: openPanel,
              deleteProperties: onDeleteProperties,
              theme: props.theme,
            },
            isDynamic,
            customJSControl,
            additionAutocomplete,
            hideEvaluatedValue(),
          )}
        </ControlWrapper>
      );
    } catch (e) {
      log.error(e);
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
