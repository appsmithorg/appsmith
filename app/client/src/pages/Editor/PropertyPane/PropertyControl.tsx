import equal from "fast-deep-equal/es6";
import _, { get, isFunction, merge } from "lodash";
import * as log from "loglevel";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";

import { Button, ToggleButton, Tooltip } from "@appsmith/ads";
import { importSvg } from "@appsmith/ads-old";
import type { IPanelProps } from "@blueprintjs/core";
import type { UpdateWidgetPropertyPayload } from "actions/controlActions";
import {
  batchUpdateMultipleWidgetProperties,
  batchUpdateWidgetProperty,
  deleteWidgetProperty,
  setWidgetDynamicProperty,
} from "actions/controlActions";
import {
  setFocusablePropertyPaneField,
  setSelectedPropertyPanel,
} from "actions/propertyPaneActions";
import classNames from "classnames";
import clsx from "clsx";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { ControlData } from "components/propertyControls/BaseControl";
import { ControlWrapper } from "components/propertyControls/StyledControls";
import type { PropertyPaneControlConfig } from "constants/PropertyControlConstants";
import {
  JS_TOGGLE_DISABLED_MESSAGE,
  JS_TOGGLE_SWITCH_JS_MESSAGE,
} from "ee/constants/messages";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { AppState } from "ee/reducers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import PropertyHelpLabel from "pages/Editor/PropertyPane/PropertyHelpLabel";
import { useDispatch, useSelector } from "react-redux";
import { getIsOneClickBindingOptionsVisibility } from "selectors/oneClickBindingSelectors";
import type { WidgetProperties } from "selectors/propertyPaneSelectors";
import {
  getShouldFocusPropertyPath,
  getWidgetPropsForPropertyName,
} from "selectors/propertyPaneSelectors";
import type { EnhancementFns } from "selectors/widgetEnhancementSelectors";
import { getParentWidget } from "selectors/widgetSelectors";
import styled from "styled-components";
import AppsmithConsole from "utils/AppsmithConsole";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { AdditionalDynamicDataTree } from "utils/autocomplete/customTreeTypeDefCreator";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import {
  getEvalValuePath,
  isDynamicValue,
  THEME_BINDING_REGEX,
} from "utils/DynamicBindingUtils";
import {
  getPropertyControlFocusElement,
  shouldFocusOnPropertyControl,
} from "utils/editorContextUtils";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import PropertyControlFactory from "utils/PropertyControlFactory";
import { getExpectedValue } from "utils/validation/common";
import type { PropertyUpdates } from "WidgetProvider/constants";
import WidgetFactory from "WidgetProvider/factory";
import { savePropertyInSessionStorageIfRequired } from "./helpers";
import PanelPropertiesEditor from "./PanelPropertiesEditor";
import PropertyPaneHelperText from "./PropertyPaneHelperText";

const ResetIcon = importSvg(
  async () => import("assets/icons/control/undo_2.svg"),
);

const StyledDeviated = styled.div`
  background-color: var(--ads-v2-color-bg-brand);
`;

const LabelContainer = styled.div<{ hasEditIcon: boolean }>`
  ${(props) => props.hasEditIcon && "max-width: calc(100% - 110px);"}
`;

type Props = PropertyPaneControlConfig & {
  panel: IPanelProps;
  theme: EditorTheme;
  isSearchResult: boolean;
  enhancements: EnhancementFns | undefined;
};

const SHOULD_NOT_REJECT_DYNAMIC_BINDING_LIST_FOR = ["COLOR_PICKER"];
// const tooltipModifier = { preventOverflow: { enabled: true } };

const PropertyControl = memo((props: Props) => {
  const dispatch = useDispatch();

  const controlRef = useRef<HTMLDivElement | null>(null);
  const [showEmptyBlock, setShowEmptyBlock] = React.useState(false);

  const propsSelector = getWidgetPropsForPropertyName(
    props.propertyName,
    props.dependencies,
    props.evaluatedDependencies,
    props.dynamicDependencies,
  );

  const widgetProperties: WidgetProperties = useSelector(propsSelector, equal);
  const parentWidget = useSelector((state) =>
    getParentWidget(state, widgetProperties.widgetId),
  );

  const isControlDisabled =
    props.shouldDisableSection &&
    props.shouldDisableSection(widgetProperties, props.propertyName);

  // get the dataTreePath and apply enhancement if exists
  let dataTreePath: string | undefined =
    props.dataTreePath || widgetProperties
      ? `${widgetProperties.widgetName}.${props.propertyName}`
      : undefined;

  // using hasDispatchedPropertyFocus to make sure
  // the component does not select the state after dispatching the action,
  // which might lead to another rerender and reset the component
  const hasDispatchedPropertyFocus = useRef<boolean>(false);
  const shouldFocusPropertyPath: boolean = useSelector(
    (state: AppState) =>
      getShouldFocusPropertyPath(
        state,
        dataTreePath,
        hasDispatchedPropertyFocus.current,
      ),
    (before: boolean, after: boolean) => {
      return hasDispatchedPropertyFocus.current || before === after;
    },
  );

  const { enhancementFns, parentIdWithEnhancementFn } =
    props.enhancements || {};

  useEffect(() => {
    // This is required because layered panels like Column Panel have Animation of 300ms
    const focusTimeout = props.isPanelProperty ? 300 : 0;

    if (shouldFocusPropertyPath) {
      setTimeout(() => {
        if (shouldFocusOnPropertyControl(controlRef.current)) {
          const focusableElement = getPropertyControlFocusElement(
            controlRef.current,
          );

          focusableElement?.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
          focusableElement?.focus();
        }
      }, focusTimeout);
    }
  }, [shouldFocusPropertyPath]);
  /**
   * A property's stylesheet value can be fetched in 2 ways
   * 1. If a method is defined on the property config (getStylesheetValue), then
   *   it's the methods responsibility to resolve the stylesheet value.
   * 2. If no such method is defined, the value is assumed to be present in the
   *   theme config and thus it is fetched from there.
   */
  const propertyStylesheetValue = (() => {
    const widgetStylesheet = WidgetFactory.getWidgetStylesheetConfigMap(
      widgetProperties.type,
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

  const experimentalJSToggle = useFeatureFlag(
    FEATURE_FLAG.ab_one_click_learning_popover_enabled,
  );

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
    shouldHidePropertyFn: childWidgetShouldHidePropertyFn,
    updateDataTreePathFn: childWidgetDataTreePathEnhancementFn,
  } = enhancementFns || {};

  const connectDataClicked = useSelector(getIsOneClickBindingOptionsVisibility);

  const toggleDynamicProperty = useCallback(
    (
      propertyName: string,
      isDynamic: boolean,
      shouldValidateValueOnDynamicPropertyOff?: boolean,
    ) => {
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
        (SHOULD_NOT_REJECT_DYNAMIC_BINDING_LIST_FOR.includes(
          props.controlType,
        ) &&
          isDynamicValue(propertyValue)) ||
        !shouldValidateValueOnDynamicPropertyOff
      ) {
        shouldRejectDynamicBindingPathList = false;
      }

      dispatch(
        setWidgetDynamicProperty(
          widgetProperties?.widgetId,
          propertyName,
          !isDynamic,
          shouldRejectDynamicBindingPathList,
          !shouldValidateValueOnDynamicPropertyOff,
        ),
      );
    },
    [
      widgetProperties?.type,
      widgetProperties?.widgetName,
      widgetProperties?.widgetId,
      props.controlType,
      propertyValue,
      dispatch,
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
    [dispatch, widgetProperties.widgetId],
  );
  const onBatchUpdatePropertiesOfMultipleWidgets = useCallback(
    (updatesArray: UpdateWidgetPropertyPayload[]) => {
      dispatch(batchUpdateMultipleWidgetProperties(updatesArray));
    },
    [dispatch],
  );
  const {
    isTriggerProperty,
    postUpdateAction,
    shouldSwitchToNormalMode,
    updateHook,
    updateRelatedWidgetProperties,
  } = props;

  const getWidgetsOwnUpdatesOnPropertyChange = useCallback(
    (
      propertyName: string,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      propertyValue: any,
    ): UpdateWidgetPropertyPayload | undefined => {
      let propertiesToUpdate: Array<PropertyUpdates> | undefined;

      // To support updating multiple properties of same widget.
      if (updateHook) {
        propertiesToUpdate = updateHook(
          widgetProperties,
          propertyName,
          propertyValue,
        );
      }

      if (propertiesToUpdate) {
        const allUpdates: Record<string, unknown> = {};
        const allDeletions: string[] = [];
        const allDynamicPropertyPathUpdate: DynamicPath[] = [];
        // TODO(abhinav): DEBUG: Ask Rahul and Ashok, if this causes issues anywhere else.

        // We add the current updated first, so that the updatehooks can override the value
        // This is needed for transformations in some cases. For example,
        // the INPUT_TEXT control uses string as default, we can convert this into a number
        // by calling an updateHook which runs the parseInt over this value.
        allUpdates[propertyName] = propertyValue;
        propertiesToUpdate.forEach(
          ({
            isDynamicPropertyPath,
            propertyPath,
            propertyValue,
            shouldDeleteProperty,
          }) => {
            if (shouldDeleteProperty) {
              allDeletions.push(propertyPath);
            } else {
              allUpdates[propertyPath] = propertyValue;
            }

            if (isDynamicPropertyPath) {
              allDynamicPropertyPathUpdate.push({
                key: propertyPath,
              });
            }
          },
        );
        AppsmithConsole.info({
          logType: LOG_TYPE.WIDGET_UPDATE,
          text: "Widget properties were updated",
          source: {
            type: ENTITY_TYPE.WIDGET,
            name: widgetProperties.widgetName,
            id: widgetProperties.widgetId,
            // TODO: Check whether these properties have
            // dependent properties
            // We should send the path that the user sends
            // instead of sending the path that was updated
            // as a side effect
            propertyPath: propertiesToUpdate[0].propertyPath,
          },
          state: allUpdates,
        });

        return {
          widgetId: widgetProperties.widgetId,
          updates: {
            modify: allUpdates,
            remove: allDeletions,
            postUpdateAction: postUpdateAction,
          },
          dynamicUpdates: {
            dynamicPropertyPathList: allDynamicPropertyPathUpdate,
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
            postUpdateAction: postUpdateAction,
          },
        };
      }
    },
    [postUpdateAction, updateHook, widgetProperties],
  );

  const getOtherWidgetPropertyChanges = useCallback(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (propertyName: string, propertyValue: any) => {
      let otherWidgetPropertiesToUpdates: UpdateWidgetPropertyPayload[] = [];

      // enhancements are one way to update property of another widget but will have leaks into the dsl
      // would recommend NOT TO FOLLOW this path for upcoming widgets.

      // if there are enhancements related to the widget, calling them here
      // enhancements are basically group of functions that are called before widget property
      // is changed on propertyPane. For e.g - set/update parent property
      if (childWidgetPropertyUpdateEnhancementFn) {
        const hookPropertiesUpdates = childWidgetPropertyUpdateEnhancementFn(
          widgetProperties.widgetName,
          propertyName,
          propertyValue,
          isTriggerProperty,
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

      if (updateRelatedWidgetProperties) {
        const relatedWidgetUpdates = updateRelatedWidgetProperties(
          propertyName,
          propertyValue,
          widgetProperties,
        );

        if (
          Array.isArray(relatedWidgetUpdates) &&
          relatedWidgetUpdates.length
        ) {
          otherWidgetPropertiesToUpdates =
            otherWidgetPropertiesToUpdates.concat(relatedWidgetUpdates);
        }
      }

      return otherWidgetPropertiesToUpdates;
    },
    [
      childWidgetPropertyUpdateEnhancementFn,
      isTriggerProperty,
      parentIdWithEnhancementFn,
      updateRelatedWidgetProperties,
      widgetProperties,
    ],
  );

  const getPropertyUpdatesWithAssociatedWidgetUpdates = useCallback(
    (
      propertyName: string,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      propertyValue: any,
    ): UpdateWidgetPropertyPayload[] => {
      const selfUpdates: UpdateWidgetPropertyPayload | undefined =
        getWidgetsOwnUpdatesOnPropertyChange(propertyName, propertyValue);

      const enhancementsToOtherWidgets: UpdateWidgetPropertyPayload[] =
        getOtherWidgetPropertyChanges(propertyName, propertyValue);

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

      return allPropertiesToUpdates;
    },
    [getOtherWidgetPropertyChanges, getWidgetsOwnUpdatesOnPropertyChange],
  );

  const onBatchUpdateWithAssociatedWidgetUpdates = useCallback(
    (
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updates: { propertyName: string; propertyValue: any }[],
      isUpdatedViaKeyboard?: boolean,
    ) => {
      AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE", {
        widgetType: widgetProperties.type,
        widgetName: widgetProperties.widgetName,
        updates,
        isUpdatedViaKeyboard,
        isUpdatedFromSearchResult: props.isSearchResult,
      });
      const consolidatedUpdates = updates
        .flatMap(({ propertyName, propertyValue }) =>
          getPropertyUpdatesWithAssociatedWidgetUpdates(
            propertyName,
            propertyValue,
          ),
        )
        .reduce(
          (
            acc: UpdateWidgetPropertyPayload[],
            curr: UpdateWidgetPropertyPayload,
          ) => {
            const findWidgetIndex = acc.findIndex(
              (val) => val.widgetId === curr.widgetId,
            );

            if (findWidgetIndex >= 0) {
              //merge updates of the same widget
              const mergeCopy = merge({}, acc[findWidgetIndex], curr);

              acc[findWidgetIndex] = mergeCopy;
            } else {
              acc.push(curr);
            }

            return acc;
          },
          [],
        );

      if (consolidatedUpdates && consolidatedUpdates.length) {
        // updating properties of a widget(s) should be done only once when property value changes.
        // to make sure dsl updates are atomic which is a necessity for undo/redo.
        onBatchUpdatePropertiesOfMultipleWidgets(consolidatedUpdates);
      }
    },
    [
      getPropertyUpdatesWithAssociatedWidgetUpdates,
      onBatchUpdatePropertiesOfMultipleWidgets,
      props.isSearchResult,
      widgetProperties.type,
      widgetProperties.widgetName,
    ],
  );

  /**
   * this function is called whenever we change any property in the property pane
   * it updates the widget property by updateWidgetPropertyRequest
   * It also calls the beforeChildPropertyUpdate hook
   */
  const onPropertyChange = useCallback(
    (
      propertyName: string,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      propertyValue: any,
      isUpdatedViaKeyboard?: boolean,
      isDynamicPropertyPath?: boolean,
    ) => {
      AnalyticsUtil.logEvent("WIDGET_PROPERTY_UPDATE", {
        widgetType: widgetProperties.type,
        widgetName: widgetProperties.widgetName,
        propertyName: propertyName,
        updatedValue: propertyValue,
        isUpdatedViaKeyboard,
        isUpdatedFromSearchResult: props.isSearchResult,
      });
      const allPropertiesToUpdates =
        getPropertyUpdatesWithAssociatedWidgetUpdates(
          propertyName,
          propertyValue,
        );

      if (allPropertiesToUpdates && allPropertiesToUpdates.length) {
        const update = allPropertiesToUpdates[0];

        if (isDynamicPropertyPath && update) {
          allPropertiesToUpdates[0] = merge({}, update, {
            dynamicUpdates: {
              dynamicPropertyPathList: [
                {
                  key: propertyName,
                },
              ],
            },
          });
        }

        // updating properties of a widget(s) should be done only once when property value changes.
        // to make sure dsl updates are atomic which is a necessity for undo/redo.
        onBatchUpdatePropertiesOfMultipleWidgets(allPropertiesToUpdates);

        savePropertyInSessionStorageIfRequired({
          isReusable: !!props.isReusable,
          widgetProperties,
          propertyName,
          propertyValue,
          parentWidgetId: parentWidget?.widgetId,
          parentWidgetType: parentWidget?.type,
        });
      }
    },
    [
      getPropertyUpdatesWithAssociatedWidgetUpdates,
      onBatchUpdatePropertiesOfMultipleWidgets,
      props.isSearchResult,
      widgetProperties.type,
      widgetProperties.widgetName,
    ],
  );

  const openPanel = useCallback(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (panelProps: any) => {
      if (props.panelConfig) {
        dispatch(
          setSelectedPropertyPanel(
            `${widgetProperties.widgetName}.${props.propertyName}`,
            panelProps.index,
          ),
        );
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
    [
      widgetProperties.widgetName,
      props.panelConfig,
      props.panel,
      props.propertyName,
      props.theme,
      onBatchUpdateProperties,
    ],
  );

  const [isRenaming, setIsRenaming] = useState(false);

  const [editedName, setEditedName] = useState(props.propertyName);

  const hasRenamingError = useCallback(() => {
    return (
      editedName.trim() === "" ||
      (editedName !== props.propertyName &&
        widgetProperties.hasOwnProperty(editedName))
    );
  }, [props, widgetProperties, editedName]);

  const onEditSave = useCallback(() => {
    if (hasRenamingError()) {
      return;
    } else if (editedName.trim() && editedName !== props.propertyName) {
      let modify = {
        [editedName]: widgetProperties[props.propertyName],
      };

      let triggerPaths: string[] = [];

      if (
        props.controlConfig &&
        typeof props.controlConfig.onEdit === "function"
      ) {
        const updates = props.controlConfig.onEdit(
          widgetProperties,
          editedName,
        );

        modify = {
          ...modify,
          ...updates.modify,
        };

        triggerPaths = updates.triggerPaths;
      }

      dispatch(
        batchUpdateWidgetProperty(widgetProperties.widgetId, {
          modify,
          triggerPaths,
        }),
      );

      onDeleteProperties([props.propertyName]);
    }

    resetEditing();

    AnalyticsUtil.logEvent("CUSTOM_WIDGET_EDIT_EVENT_SAVE_CLICKED", {
      widgetId: widgetProperties.widgetId,
    });
  }, [
    props,
    batchUpdateWidgetProperty,
    onDeleteProperties,
    props.propertyName,
    editedName,
  ]);

  const resetEditing = useCallback(() => {
    setEditedName(props.propertyName);
    setIsRenaming(false);

    AnalyticsUtil.logEvent("CUSTOM_WIDGET_EDIT_EVENT_CANCEL_CLICKED", {
      widgetId: widgetProperties.widgetId,
    });
  }, [props.propertyName]);

  const { propertyName } = props;

  if (widgetProperties) {
    // Do not render the control if it needs to be hidden
    if (
      (props.hidden && props.hidden(widgetProperties, props.propertyName)) ||
      props.invisible ||
      (childWidgetShouldHidePropertyFn &&
        childWidgetShouldHidePropertyFn(widgetProperties, props.propertyName))
    ) {
      return null;
    }

    const label = isFunction(props.label)
      ? props.label(widgetProperties, propertyName)
      : props.label;

    const helperText = isFunction(props.helperText)
      ? props.helperText(widgetProperties)
      : props.helperText;

    dataTreePath =
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
      label,
    };

    config.expected = getExpectedValue(props.validation);

    if (widgetProperties.isPropertyDynamicTrigger) {
      config.validationMessage = "";
      config.expected = {
        example: 'showAlert("There was an error!", "error")',
        type: "Function",
        autocompleteDataType: AutocompleteDataType.FUNCTION,
      };
      delete config.evaluatedValue;
    }

    const isDynamic: boolean = widgetProperties.isPropertyDynamicPath;
    const isConvertible = !!props.isJSConvertible;
    const className = label.split(" ").join("").toLowerCase();

    let additionAutocomplete: AdditionalDynamicDataTree | undefined;

    if (additionalAutoComplete) {
      additionAutocomplete = additionalAutoComplete(widgetProperties);
    } else if (childWidgetAutoCompleteEnhancementFn) {
      additionAutocomplete = childWidgetAutoCompleteEnhancementFn() as
        | AdditionalDynamicDataTree
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

    const handleOnFocus = () => {
      if (!shouldFocusPropertyPath) {
        hasDispatchedPropertyFocus.current = true;
        setTimeout(() => {
          dispatch(setFocusablePropertyPaneField(dataTreePath));
        }, 0);
      }
    };

    const uniqId = btoa(`${widgetProperties.widgetId}.${propertyName}`);
    const controlMethods = PropertyControlFactory.controlMethods.get(
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
          const extractValue =
            PropertyControlFactory.inputComputedValueMap.get(customJSControl);

          if (extractValue)
            value = extractValue(value, widgetProperties.widgetName);
        }

        // disable button if value can't be represented in UI mode
        if (!controlMethods?.canDisplayValueInUI?.(config, value))
          isToggleDisabled = true;
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

    const helpText = isControlDisabled
      ? props.disabledHelpText || ""
      : config.controlType === "ACTION_SELECTOR"
        ? `Configure one or chain multiple actions. ${props.helpText}. All nested actions run at the same time.`
        : props.helpText;

    if (config.controlType === "ACTION_SELECTOR") {
      config.additionalControlData = {
        ...config.additionalControlData,
        showEmptyBlock,
        setShowEmptyBlock,
      };
    }

    if (shouldSwitchToNormalMode) {
      const switchMode = shouldSwitchToNormalMode(
        isDynamic,
        isToggleDisabled,
        connectDataClicked,
      );

      if (switchMode) {
        toggleDynamicProperty(propertyName, true);
      }
    }

    const JSToggleTooltip = isToggleDisabled
      ? JS_TOGGLE_DISABLED_MESSAGE
      : !isDynamic
        ? JS_TOGGLE_SWITCH_JS_MESSAGE
        : "";

    try {
      return (
        <ControlWrapper
          className={`t--property-control-wrapper t--property-control-${className} group relative ${isControlDisabled ? "cursor-not-allowed opacity-50" : ""}`}
          data-guided-tour-iid={propertyName}
          id={uniqId}
          key={config.id}
          onFocus={handleOnFocus}
          orientation={
            config.controlType === "SWITCH" && !isDynamic
              ? "HORIZONTAL"
              : "VERTICAL"
          }
          ref={controlRef}
        >
          {isRenaming && config.controlConfig?.allowEdit ? (
            <div className="flex items-center justify-between">
              <div className="grow">
                <input
                  autoFocus
                  className={clsx(
                    "w-full rounded-sm !outline !outline-2 !outline-offset-1",
                    hasRenamingError()
                      ? "!outline-[var(--ads-v2-colors-control-field-error-border)]"
                      : "!outline-[#8BB0FA]",
                  )}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Non-word characters are replaced with underscores for valid property naming
                    setEditedName(value.split(/\W+/).join("_"));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onEditSave();
                    } else if (e.key === "Escape") {
                      resetEditing();
                    }
                  }}
                  placeholder="Enter label"
                  value={editedName}
                />
              </div>
              <div>
                <Button
                  className={clsx(
                    `${config.label}`,
                    "edit-control flex items-center justify-center text-center h-7 w-7",
                    `t--edit-control-${config.label}`,
                  )}
                  isDisabled={hasRenamingError()}
                  isIconButton
                  kind="tertiary"
                  onClick={() => {
                    onEditSave();
                  }}
                  size="sm"
                  startIcon="check-line"
                />
              </div>
              <div>
                <Button
                  className={clsx(
                    `${config.label}`,
                    "edit-control flex items-center justify-center text-center h-7 w-7",
                    `t--edit-control-${config.label}`,
                  )}
                  isIconButton
                  kind="tertiary"
                  onClick={() => {
                    resetEditing();
                  }}
                  size="sm"
                  startIcon="close-x"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <LabelContainer
                className={clsx("flex items-center justify-right gap-1")}
                hasEditIcon={
                  !!config.controlConfig?.allowEdit ||
                  !!config.controlConfig?.allowDelete
                }
              >
                <PropertyHelpLabel
                  className="fit-content"
                  label={label}
                  theme={props.theme}
                  tooltip={helpText}
                />
                {isConvertible && (
                  <Tooltip
                    content={JSToggleTooltip}
                    isDisabled={!JSToggleTooltip}
                  >
                    <span>
                      <ToggleButton
                        className={classNames({
                          "t--js-toggle": true,
                          "is-active": isDynamic,
                          "!h-[20px]": experimentalJSToggle,
                        })}
                        icon="js-toggle-v2"
                        isDisabled={isToggleDisabled}
                        isSelected={isDynamic}
                        onClick={() =>
                          toggleDynamicProperty(
                            propertyName,
                            isDynamic,
                            controlMethods?.shouldValidateValueOnDynamicPropertyOff(
                              config,
                              propertyValue,
                            ),
                          )
                        }
                        size={experimentalJSToggle ? "md" : "sm"}
                      />
                    </span>
                  </Tooltip>
                )}
                {isPropertyDeviatedFromTheme && (
                  <>
                    <Tooltip content="Value deviated from theme">
                      <StyledDeviated className="w-2 h-2 rounded-full" />
                    </Tooltip>
                    <button
                      className="hidden ml-auto focus:ring-2 group-hover:block reset-button"
                      onClick={resetPropertyValueToTheme}
                    >
                      <Tooltip content="Reset value" placement="topRight">
                        <ResetIcon className="w-5 h-5" />
                      </Tooltip>
                    </button>
                  </>
                )}
              </LabelContainer>
              <div className={clsx("flex items-center justify-right")}>
                {config.controlConfig?.allowEdit && (
                  <Button
                    className={clsx(
                      `${config.label}`,
                      "edit-control flex items-center justify-center text-center h-7 w-7",
                      `t--edit-control-${config.label}`,
                    )}
                    isIconButton
                    kind="tertiary"
                    onClick={() => {
                      setIsRenaming(true);
                      AnalyticsUtil.logEvent(
                        "CUSTOM_WIDGET_EDIT_EVENT_CLICKED",
                        {
                          widgetId: widgetProperties.widgetId,
                        },
                      );
                    }}
                    size="sm"
                    startIcon="pencil-line"
                  />
                )}
                {config.controlConfig?.allowDelete && (
                  <Button
                    className={clsx(
                      `${config.label}`,
                      "delete-control flex items-center justify-center text-center h-7 w-7",
                      `t--delete-control-${config.label}`,
                    )}
                    isIconButton
                    kind="tertiary"
                    onClick={() => {
                      if (
                        config.controlConfig &&
                        typeof config.controlConfig.onDelete === "function"
                      ) {
                        const updates =
                          config.controlConfig.onDelete(widgetProperties);

                        onBatchUpdateProperties(updates);
                      }

                      onDeleteProperties([config.propertyName]);

                      AnalyticsUtil.logEvent(
                        "CUSTOM_WIDGET_DELETE_EVENT_CLICKED",
                        {
                          widgetId: widgetProperties.widgetId,
                        },
                      );
                    }}
                    size="sm"
                    startIcon="trash"
                  />
                )}
                {!isDynamic && config.controlType === "ACTION_SELECTOR" && (
                  <Button
                    className={clsx(
                      `${config.label}`,
                      "add-action flex items-center justify-center text-center h-7 w-7",
                      `t--add-action-${config.label}`,
                    )}
                    isIconButton
                    kind="tertiary"
                    onClick={() => setShowEmptyBlock(true)}
                    startIcon="plus"
                  />
                )}
              </div>
            </div>
          )}
          {!isControlDisabled &&
            PropertyControlFactory.createControl(
              config,
              {
                onPropertyChange: onPropertyChange,
                onBatchUpdateProperties: onBatchUpdateProperties,
                openNextPanel: openPanel,
                deleteProperties: onDeleteProperties,
                onBatchUpdateWithAssociatedUpdates:
                  onBatchUpdateWithAssociatedWidgetUpdates,
                theme: props.theme,
              },
              isDynamic,
              customJSControl,
              additionAutocomplete,
              hideEvaluatedValue(),
              props.isSearchResult,
            )}
          <PropertyPaneHelperText helperText={helperText} />
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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(PropertyControl as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default PropertyControl;
