import WidgetFactory from "utils/WidgetFactory";
import { getAllPathsFromPropertyConfig } from "entities/Widget/utils";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import _ from "lodash";
import { DataTreeWidget, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";

export const generateDataTreeWidget = (
  widget: FlattenedWidgetProps,
  widgetMetaProps: Record<string, unknown>,
): DataTreeWidget => {
  const derivedProps: any = {};
  const blockedDerivedProps: Record<string, true> = {};
  const unInitializedDefaultProps: Record<string, undefined> = {};
  const overridingProperties: Record<string, string> = {};
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
    // Do not log errors for the derived property bindings
    blockedDerivedProps[propertyName] = true;
  });

  Object.entries(defaultProps).forEach(
    ([metaPropertyName, defaultPropertyName]) => {
      // All meta values need to exist in the tree, so we initialize them if they don't exist
      if (!(metaPropertyName in widget)) {
        unInitializedDefaultProps[metaPropertyName] = undefined;
      }
      // Overriding properties will override the values of a property when evaluated
      overridingProperties[`meta.${metaPropertyName}`] = metaPropertyName;
      overridingProperties[defaultPropertyName] = metaPropertyName;
    },
  );

  const {
    bindingPaths,
    triggerPaths,
    validationPaths,
  } = getAllPathsFromPropertyConfig(widget, propertyPaneConfigs, {
    ...derivedPropertyMap,
    ...defaultMetaProps,
    ...unInitializedDefaultProps,
    ..._.keyBy(dynamicBindingPathList, "key"),
  });
  return {
    ...widget,
    ...unInitializedDefaultProps,
    ...defaultMetaProps,
    ...derivedProps,
    defaultProps,
    defaultMetaProps: Object.keys(defaultMetaProps),
    dynamicBindingPathList,
    logBlackList: {
      ...widget.logBlackList,
      ...blockedDerivedProps,
    },
    meta: widgetMetaProps,
    overridingProperties,
    bindingPaths,
    triggerPaths,
    validationPaths,
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  };
};
