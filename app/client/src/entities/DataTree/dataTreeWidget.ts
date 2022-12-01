import { getAllPathsFromPropertyConfig } from "entities/Widget/utils";
import _ from "lodash";
import memoize from "micro-memoize";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import WidgetFactory from "utils/WidgetFactory";
import {
  DataTreeWidget,
  ENTITY_TYPE,
  OverridingPropertyPaths,
  OverridingPropertyType,
  PropertyOverrideDependency,
} from "./dataTreeFactory";
import { setOverridingProperty } from "./utils";

// We are splitting generateDataTreeWidget into two parts to memoize better as the widget doesn't change very often.
// Widget changes only when dynamicBindingPathList changes.
// Only meta properties change very often, for example typing in an input or selecting a table row.
const generateDataTreeWidgetWithoutMeta = (
  widget: FlattenedWidgetProps,
): {
  dataTreeWidgetWithoutMetaProps: DataTreeWidget;
  overridingMetaPropsMap: Record<string, boolean>;
  defaultMetaProps: Record<string, unknown>;
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

  const {
    bindingPaths,
    reactivePaths,
    triggerPaths,
    validationPaths,
  } = getAllPathsFromPropertyConfig(widget, propertyPaneConfigs, {
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
  const dataTreeWidgetWithoutMetaProps = _.merge(
    {},
    widget,
    unInitializedDefaultProps,
    // defaultMetaProps,
    // widgetMetaProps,
    derivedProps,
    {
      defaultProps,
      defaultMetaProps: Object.keys(defaultMetaProps),
      dynamicBindingPathList,
      logBlackList: {
        ...widget.logBlackList,
        ...blockedDerivedProps,
      },
      meta: {}, // this will be overridden by meta value calculated in generateDataTreeWidget
      propertyOverrideDependency,
      overridingPropertyPaths,
      bindingPaths,
      reactivePaths,
      triggerPaths,
      validationPaths,
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      privateWidgets: {
        ...widget.privateWidgets,
      },
    },
  );
  return {
    dataTreeWidgetWithoutMetaProps,
    overridingMetaPropsMap,
    defaultMetaProps,
  };
};

// @todo set the max size dynamically based on number of widgets. (widgets.length)
// Remove the debug statements in July 2022
const generateDataTreeWidgetWithoutMetaMemoized = memoize(
  generateDataTreeWidgetWithoutMeta,
  {
    maxSize: 1000,
    // onCacheHit: (cache, options) => {
    //   console.log("####### cache was hit: ", cache.keys.length);
    // },
    // onCacheAdd: (cache, options) => {
    //   console.log(
    //     "####### cache was missed ",
    //     cache.keys.length,
    //     cache.keys[0][0].widgetName,
    //   );
    // },
  },
);

export const generateDataTreeWidget = (
  widget: FlattenedWidgetProps,
  widgetMetaProps: Record<string, unknown> = {},
) => {
  const {
    dataTreeWidgetWithoutMetaProps: dataTreeWidget,
    defaultMetaProps,
    overridingMetaPropsMap,
  } = generateDataTreeWidgetWithoutMetaMemoized(widget);
  const overridingMetaProps: Record<string, unknown> = {};

  // overridingMetaProps has all meta property value either from metaReducer or default set by widget whose dependent property also has default property.
  Object.entries(defaultMetaProps).forEach(([key, value]) => {
    if (overridingMetaPropsMap[key]) {
      overridingMetaProps[key] =
        key in widgetMetaProps ? widgetMetaProps[key] : value;
    }
  });

  const meta = _.merge({}, overridingMetaProps, widgetMetaProps);

  // if meta property's value is defined in widgetMetaProps then use that else set meta property to default metaProperty value.
  const mergedProperties = _.merge({}, defaultMetaProps, widgetMetaProps);

  Object.entries(mergedProperties).forEach(([key, value]) => {
    // Since meta properties are always updated as a whole, we are replacing instead of merging.
    // Merging mutates the memoized value, avoid merging meta values
    dataTreeWidget[key] = value;
  });

  dataTreeWidget["meta"] = meta;
  return dataTreeWidget;
};
