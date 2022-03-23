import React, { memo, useCallback } from "react";
import _, { isEqual } from "lodash";
import {
  ControlPropertyLabelContainer,
  ControlWrapper,
  JSToggleButton,
} from "components/propertyControls/StyledControls";
import { ControlIcons } from "icons/ControlIcons";
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
  isPathADynamicProperty,
  isPathADynamicTrigger,
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
import * as log from "loglevel";

type Props = PropertyPaneControlConfig & {
  panel: IPanelProps;
  theme: EditorTheme;
};

const PropertyControl = memo((props: Props) => {
  const dispatch = useDispatch();

  const propsSelector = getWidgetPropsForPropertyName(
    props.propertyName,
    props.dependencies,
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
      dispatch(
        setWidgetDynamicProperty(
          widgetProperties?.widgetId,
          propertyName,
          !isDynamic,
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
      dataTreePath = childWidgetDataTreePathEnhancementFn(
        dataTreePath,
      ) as string;
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

    try {
      return (
        <ControlWrapper
          className={`t--property-control-${className}`}
          data-guided-tour-iid={propertyName}
          id={uniqId}
          key={config.id}
          orientation={
            config.controlType === "SWITCH" && !isDynamic
              ? "HORIZONTAL"
              : "VERTICAL"
          }
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
