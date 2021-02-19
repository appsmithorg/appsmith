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
import {
  RenderModes,
  WidgetType,
  WidgetTypes,
} from "constants/WidgetConstants";
import { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import { IPanelProps } from "@blueprintjs/core";
import PanelPropertiesEditor from "./PanelPropertiesEditor";
import {
  isPathADynamicProperty,
  isPathADynamicTrigger,
} from "utils/DynamicBindingUtils";
import {
  getWidgetPropsForPropertyPane,
  getEnhancementsMap,
} from "selectors/propertyPaneSelectors";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import { OnboardingStep } from "constants/OnboardingConstants";
import { PropertyPaneEnhancements } from ".";
import { getWidgets } from "sagas/selectors";
import Indicator from "components/editorComponents/Onboarding/Indicator";

type Props = PropertyPaneControlConfig & {
  panel: IPanelProps;
  enhancements?: PropertyPaneEnhancements;
};

const PropertyControl = memo((props: Props) => {
  const dispatch = useDispatch();
  const stateWidgets = useSelector(getWidgets);
  const widgetProperties: any = useSelector(getWidgetPropsForPropertyPane);
  const enhancementsMap = useSelector(getEnhancementsMap);

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
        batchUpdateWidgetProperty(widgetProperties.widgetId, allUpdates),
      ),
    [widgetProperties.widgetId, dispatch],
  );
  // this function updates the properties of widget passed
  const onBatchUpdatePropertiesOfWidget = useCallback(
    (allUpdates: Record<string, unknown>, widgetId: string) =>
      dispatch(batchUpdateWidgetProperty(widgetId, allUpdates)),
    [dispatch],
  );

  /**
   * this function is called whenever we change any property in the property pane
   * it updates the widget property by updateWidgetPropertyRequest
   * It also calls the beforeChildPropertyUpdate hook
   */
  const onPropertyChange = useCallback(
    (propertyName: string, propertyValue: any, isDynamicTrigger?: boolean) => {
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
      if (props.enhancements?.beforeChildPropertyUpdate) {
        // TODO: Concat if exists, else replace
        const hookPropertiesUpdates = props.enhancements.beforeChildPropertyUpdate(
          widgetProperties.widgetName,
          get(enhancementsMap[widgetProperties.widgetId], "parentId", ""),
          get(enhancementsMap[widgetProperties.widgetId], "parentWidgetName"),
          propertyName,
          propertyValue,
        );

        if (
          Array.isArray(hookPropertiesUpdates) &&
          hookPropertiesUpdates.length > 0
        ) {
          const allUpdates: Record<string, unknown> = {};
          hookPropertiesUpdates.forEach(({ propertyPath, propertyValue }) => {
            allUpdates[propertyPath] = propertyValue;
          });

          onBatchUpdatePropertiesOfWidget(
            allUpdates,
            get(enhancementsMap[widgetProperties.widgetId], "parentId", ""),
          );
        }
      }

      if (propertiesToUpdate) {
        const allUpdates: Record<string, unknown> = {};
        propertiesToUpdate.forEach(({ propertyPath, propertyValue }) => {
          allUpdates[propertyPath] = propertyValue;
        });
        if (!isDynamicTrigger) allUpdates[propertyName] = propertyValue;
        onBatchUpdateProperties(allUpdates);
      }
      if (!propertiesToUpdate || isDynamicTrigger) {
        dispatch(
          updateWidgetPropertyRequest(
            widgetProperties.widgetId,
            propertyName,
            propertyValue,
            RenderModes.CANVAS, // This seems to be not needed anymore.
            isDynamicTrigger,
          ),
        );
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
    const { additionalAutoComplete, ...rest } = props;
    const config = {
      ...rest,
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
      listWidgetProperties: {},
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

    const enhancementsMapOfWidget = get(
      enhancementsMap,
      `${widgetProperties.widgetId}`,
    );

    const isListOrChildOfList =
      get(enhancementsMapOfWidget, "type") === WidgetTypes.LIST_WIDGET;

    // adding list widget properties in the config so that we can retrive in the control
    if (isListOrChildOfList) {
      const parentId = get(enhancementsMapOfWidget, "parentId");

      if (parentId) {
        config.listWidgetProperties = stateWidgets[parentId];
      } else {
        config.listWidgetProperties = stateWidgets[widgetProperties.widgetId];
      }
    }

    /**
     * if there is customJSControl being passed, use that,
     * if the current widget is associated with list widget, use "COMPUTE_LIST_VALUE"
     *
     * Note: "COMPUTE_LIST_VALUE" helps in showing currentItem automcomplete in property pane
     */
    const getCustomJSControl = () => {
      if (props.customJSControl) return props.customJSControl;

      if (isListOrChildOfList) {
        return "COMPUTE_LIST_VALUE";
      }
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
            step={OnboardingStep.DEPLOY}
            show={
              propertyName !== "isRequired" && propertyName !== "isDisabled"
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
            <Indicator
              step={OnboardingStep.ADD_INPUT_WIDGET}
              show={propertyName === "onSubmit"}
            >
              {PropertyControlFactory.createControl(
                config,
                {
                  onPropertyChange: onPropertyChange,
                  openNextPanel: openPanel,
                  deleteProperties: onDeleteProperties,
                },
                isDynamic,
                getCustomJSControl(),
                additionalAutoComplete
                  ? additionalAutoComplete(widgetProperties)
                  : undefined,
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
