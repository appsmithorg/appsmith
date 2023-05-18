import { getAllPathsFromPropertyConfig } from "entities/Widget/utils";
import _, { isEmpty } from "lodash";
import memoize from "micro-memoize";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import WidgetFactory from "utils/WidgetFactory";
import type { WidgetEntityConfig, WidgetEntity } from "./dataTreeFactory";
import { ENTITY_TYPE } from "./dataTreeFactory";
import type {
  OverridingPropertyPaths,
  PropertyOverrideDependency,
} from "./types";
import { OverridingPropertyType } from "./types";

import { setOverridingProperty } from "./utils";

// We are splitting generateDataTreeWidget into two parts to memoize better as the widget doesn't change very often.
// Widget changes only when dynamicBindingPathList changes.
// Only meta properties change very often, for example typing in an input or selecting a table row.
const generateDataTreeWidgetWithoutMeta = (
  widget: FlattenedWidgetProps,
): {
  dataTreeWidgetWithoutMetaProps: WidgetEntity;
  overridingMetaPropsMap: Record<string, boolean>;
  defaultMetaProps: Record<string, unknown>;
  entityConfig: WidgetEntityConfig;
} => {
  const derivedProps: any = {};
  const blockedDerivedProps: Record<string, true> = {};
  const unInitializedDefaultProps: Record<string, undefined> = {};
  const propertyOverrideDependency: PropertyOverrideDependency = {};
  const overridingPropertyPaths: OverridingPropertyPaths = {};
  const defaultMetaProps = WidgetFactory.getWidgetMetaPropertiesMap(
    widget.type,
  );

  const derivedPropertyMap = WidgetFactory.getWidgetDerivedPropertiesMap(
    widget.type,
  );
  const defaultProps = WidgetFactory.getWidgetDefaultPropertiesMap(widget.type);

  const propertyPaneConfigs = WidgetFactory.getWidgetPropertyPaneConfig(
    widget.type,
  );
  const dynamicBindingPathList = getEntityDynamicBindingPathList(widget);
  // Ensure all dynamic bindings are strings as they will be evaluated
  dynamicBindingPathList.forEach((dynamicPath) => {
    const propertyPath = dynamicPath.key;
    const propertyValue = _.get(widget, propertyPath);
    if (_.isObject(propertyValue)) {
      // Stringify this because composite controls may have bindings in the sub controls
      _.set(widget, propertyPath, JSON.stringify(propertyValue));
    }
  });
  // Derived props are stored in different maps for further treatment
  Object.keys(derivedPropertyMap).forEach((propertyName) => {
    // TODO regex is too greedy
    // Replace the references to `this` with the widget name reference
    // in the derived property bindings
    derivedProps[propertyName] = derivedPropertyMap[propertyName].replace(
      /this./g,
      `${widget.widgetName}.`,
    );
    // Add these to the dynamicBindingPathList as well
    dynamicBindingPathList.push({
      key: propertyName,
    });
  });

  Object.keys(derivedProps).forEach((propertyName) => {
    // Do not log errors for the derived property bindings
    blockedDerivedProps[propertyName] = true;
  });

  // Map of properties that can be overridden by both meta and default values
  const overridingMetaPropsMap: Record<string, boolean> = {};

  Object.entries(defaultProps).forEach(
    ([propertyName, defaultPropertyName]) => {
      if (!(defaultPropertyName in widget)) {
        unInitializedDefaultProps[defaultPropertyName] = undefined;
      }
      // defaultProperty on eval needs to override the widget's property eg: defaultText overrides text
      setOverridingProperty({
        propertyOverrideDependency,
        overridingPropertyPaths,
        value: defaultPropertyName,
        key: propertyName,
        type: OverridingPropertyType.DEFAULT,
      });

      if (propertyName in defaultMetaProps) {
        // Overriding properties will override the values of a property when evaluated
        setOverridingProperty({
          propertyOverrideDependency,
          overridingPropertyPaths,
          value: `meta.${propertyName}`,
          key: propertyName,
          type: OverridingPropertyType.META,
        });
        overridingMetaPropsMap[propertyName] = true;
      }
    },
  );

  const { bindingPaths, reactivePaths, triggerPaths, validationPaths } =
    getAllPathsFromPropertyConfig(widget, propertyPaneConfigs, {
      ...derivedPropertyMap,
      ...defaultMetaProps,
      ...unInitializedDefaultProps,
      ..._.keyBy(dynamicBindingPathList, "key"),
      ...overridingPropertyPaths,
    });

  /**
   * Spread operator does not merge deep objects properly.
   * Eg a = {
   *   foo: { bar: 100 }
   * }
   * b = {
   *  foo: { baz: 200 }
   * }
   *
   * { ...a, ...b }
   *
   * {
   *  foo: { baz: 200 } // bar in "a" object got overridden by baz in "b"
   * }
   *
   * Therefore spread is replaced with "merge" which merges objects recursively.
   */

  const widgetPathsToOmit = [
    "dynamicBindingPathList",
    "dynamicPropertyPathList",
    "dynamicTriggerPathList",
    "privateWidgets",
    "type",
  ];

  const dataTreeWidgetWithoutMetaProps = _.merge(
    {
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    },
    _.omit(widget, widgetPathsToOmit),
    unInitializedDefaultProps,
    derivedProps,
  );

  const dynamicPathsList: {
    dynamicPropertyPathList?: DynamicPath[];
    dynamicTriggerPathList?: DynamicPath[];
  } = {};
  if (widget.dynamicPropertyPathList)
    dynamicPathsList.dynamicPropertyPathList = widget.dynamicPropertyPathList;
  if (widget.dynamicTriggerPathList)
    dynamicPathsList.dynamicTriggerPathList = widget.dynamicTriggerPathList;

  return {
    dataTreeWidgetWithoutMetaProps,
    overridingMetaPropsMap,
    defaultMetaProps,
    entityConfig: {
      defaultProps,
      defaultMetaProps: Object.keys(defaultMetaProps),
      dynamicBindingPathList,
      logBlackList: {
        ...widget.logBlackList,
        ...blockedDerivedProps,
      },
      bindingPaths,
      reactivePaths,
      triggerPaths,
      validationPaths,
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      privateWidgets: {
        ...widget.privateWidgets,
      },
      propertyOverrideDependency,
      overridingPropertyPaths,
      type: widget.type,
      ...dynamicPathsList,
    },
  };
};

// @todo set the max size dynamically based on number of widgets. (widgets.length)

const generateDataTreeWidgetWithoutMetaMemoized = memoize(
  generateDataTreeWidgetWithoutMeta,
  {
    maxSize: 1000,
  },
);

export const generateDataTreeWidget = (
  widget: FlattenedWidgetProps,
  widgetMetaProps: Record<string, unknown> = {},
) => {
  const {
    dataTreeWidgetWithoutMetaProps: dataTreeWidget,
    defaultMetaProps,
    entityConfig,
    overridingMetaPropsMap,
  } = generateDataTreeWidgetWithoutMetaMemoized(widget);
  const overridingMetaProps: Record<string, unknown> = {};

  // overridingMetaProps maps properties that can be overriden by either default values or meta changes to initial values.
  // initial value is set to metaProps value or defaultMetaProps value.
  Object.entries(defaultMetaProps).forEach(([key, value]) => {
    if (overridingMetaPropsMap[key]) {
      overridingMetaProps[key] =
        key in widgetMetaProps ? widgetMetaProps[key] : value;
    }
  });

  entityConfig.isMetaPropDirty = !isEmpty(widgetMetaProps);

  const meta = _.merge({}, overridingMetaProps, widgetMetaProps);

  // if meta property's value is defined in widgetMetaProps then use that else set meta property to default metaProperty value.
  const mergedProperties = _.merge({}, defaultMetaProps, widgetMetaProps);

  Object.entries(mergedProperties).forEach(([key, value]) => {
    // Since meta properties are always updated as a whole, we are replacing instead of merging.
    // Merging mutates the memoized value, avoid merging meta values
    dataTreeWidget[key] = value;
  });

  dataTreeWidget["meta"] = meta;

  return {
    unEvalEntity: { ...dataTreeWidget, type: widget.type },
    configEntity: { ...entityConfig, widgetId: dataTreeWidget.widgetId },
  };
};
