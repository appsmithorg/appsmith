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
  const { bindingPaths, triggerPaths } = getAllPathsFromPropertyConfig(
    widget,
    propertyPaneConfigs,
    Object.fromEntries(
      Object.keys(derivedPropertyMap).map((key) => [key, true]),
    ),
  );
  Object.keys(defaultMetaProps).forEach((defaultPath) => {
    bindingPaths[defaultPath] = true;
  });
  const derivedProps: any = {};
  const dynamicBindingPathList = getEntityDynamicBindingPathList(widget);
  dynamicBindingPathList.forEach((dynamicPath) => {
    const propertyPath = dynamicPath.key;
    // Add any dynamically generated dynamic bindings in the binding paths
    bindingPaths[propertyPath] = true;
    const propertyValue = _.get(widget, propertyPath);
    if (_.isObject(propertyValue)) {
      // Stringify this because composite controls may have bindings in the sub controls
      _.set(widget, propertyPath, JSON.stringify(propertyValue));
    }
  });
  Object.keys(derivedPropertyMap).forEach((propertyName) => {
    // TODO regex is too greedy
    derivedProps[propertyName] = derivedPropertyMap[propertyName].replace(
      /this./g,
      `${widget.widgetName}.`,
    );
    dynamicBindingPathList.push({
      key: propertyName,
    });
    bindingPaths[propertyName] = true;
  });
  const unInitializedDefaultProps: Record<string, undefined> = {};
  Object.values(defaultProps).forEach((propertyName) => {
    if (!(propertyName in widget)) {
      unInitializedDefaultProps[propertyName] = undefined;
    }
  });
  return {
    ...widget,
    ...defaultMetaProps,
    ...widgetMetaProps,
    ...derivedProps,
    ...unInitializedDefaultProps,
    dynamicBindingPathList,
    bindingPaths,
    triggerPaths,
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
  };
};
