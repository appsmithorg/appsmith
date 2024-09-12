import { getAllPathsFromPropertyConfig } from "entities/Widget/utils";
import _, { get, isEmpty } from "lodash";
import memoize from "micro-memoize";
import type { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import { getEntityDynamicBindingPathList } from "utils/DynamicBindingUtils";
import type {
  WidgetEntityConfig,
  WidgetEntity,
} from "ee/entities/DataTree/types";
import { ENTITY_TYPE } from "./dataTreeFactory";
import type {
  OverridingPropertyPaths,
  PropertyOverrideDependency,
} from "ee/entities/DataTree/types";
import { OverridingPropertyType } from "ee/entities/DataTree/types";

import { setOverridingProperty } from "ee/entities/DataTree/utils";
import { error } from "loglevel";
import WidgetFactory from "WidgetProvider/factory";
import { getComponentDimensions } from "layoutSystems/common/utils/ComponentSizeUtils";
import type { LoadingEntitiesState } from "reducers/evaluationReducers/loadingEntitiesReducer";
import { LayoutSystemTypes } from "layoutSystems/types";

/**
 *
 * Example of setterConfig
 *
 * {
      WIDGET: {
        TABLE_WIDGET_V2: {
          __setters: {
              setIsRequired: {
                path: "isRequired"
              },
          },
          "text": {
              __setters:{
                setIsRequired: {
                    path: "primaryColumns.$columnId.isRequired"
                }
              }
          }
          pathToSetters: [{ path: "primaryColumns.$columnId", property: "columnType" }]
        }
      }
    }

    columnId = action

    Expected output

      {
        Table2: {
          isRequired: true,
          __setters: {
            setIsRequired: {
              path: "Table2.isRequired"
            },
            "primaryColumns.action.setIsRequired": {
              path: "Table2.primaryColumns.action.isRequired"
            }
          },
        }
      }
 */

export function getSetterConfig(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setterConfig: Record<string, any>,
  widget: FlattenedWidgetProps,
) {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modifiedSetterConfig: Record<string, any> = {};

  try {
    if (setterConfig.__setters) {
      modifiedSetterConfig.__setters = {};
      for (const setterMethodName of Object.keys(setterConfig.__setters)) {
        const staticConfigSetter = setterConfig.__setters[setterMethodName];

        modifiedSetterConfig.__setters[setterMethodName] = {
          path: `${widget.widgetName}.${staticConfigSetter.path}`,
          type: staticConfigSetter.type,
        };

        if (staticConfigSetter.disabled) {
          modifiedSetterConfig.__setters[setterMethodName].disabled =
            staticConfigSetter.disabled;
        }

        if (staticConfigSetter.accessor) {
          modifiedSetterConfig.__setters[setterMethodName].accessor =
            `${widget.widgetName}.${staticConfigSetter.accessor}`;
        }
      }
    }

    if (!setterConfig.pathToSetters || !setterConfig.pathToSetters.length)
      return modifiedSetterConfig;

    const pathToSetters = setterConfig.pathToSetters;

    //pathToSetters = [{ path: "primaryColumns.$columnId", property: "columnType" }]
    for (const { path, property } of pathToSetters) {
      const pathArray = path.split(".");
      const placeHolder = pathArray[pathArray.length - 1];

      if (placeHolder[0] !== "$") continue;

      //pathToParentObj = primaryColumns
      const pathToParentObj = pathArray.slice(0, -1).join(".");
      const accessors = Object.keys(get(widget, pathToParentObj));

      //accessors = action, step, status, task
      for (const accesskey of accessors) {
        const fullPath = pathToParentObj + "." + accesskey;
        const accessorObject = get(widget, fullPath);

        //propertyType = text, button etc
        const propertyType = accessorObject[property];
        if (!propertyType) continue;

        // "text": {
        //     __setters:{
        //       setIsRequired: {
        //           path: "primaryColumns.$columnId.isRequired"
        //       }
        //     }
        // }
        const accessorSetterConfig = setterConfig[propertyType];
        if (!accessorSetterConfig) continue;

        const accessorSettersMap = accessorSetterConfig.__setters;
        if (!accessorSettersMap) continue;

        const entries = Object.entries(accessorSettersMap) as [
          string,
          Record<string, unknown>,
        ][];

        for (const [setterName, setterBody] of entries) {
          //path = primaryColumns.action.isRequired
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const path = (setterBody as any).path.replace(placeHolder, accesskey);
          const setterPathArray = path.split(".");
          setterPathArray.pop();
          setterPathArray.push(setterName);

          //setterPath = primaryColumns.action.setIsRequired
          const setterPath = setterPathArray.join(".");
          modifiedSetterConfig.__setters[setterPath] = {
            path: `${widget.widgetName}.${path}`, //Table2.primaryColumns.action.isRequired
            type: setterBody.type,
          };
        }
      }
    }
  } catch (e) {
    error("Error while generating setter config", e);
  }

  return modifiedSetterConfig;
}

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const dependencyMap = WidgetFactory.getWidgetDependencyMap(widget.type);

  const propertyPaneConfigs = WidgetFactory.getWidgetPropertyPaneConfig(
    widget.type,
    widget,
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
      // ...defaultMetaProps,
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

  const setterConfig = getSetterConfig(
    WidgetFactory.getWidgetSetterConfig(widget.type),
    widget,
  );

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
      widgetId: widget.widgetId,
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
      dependencyMap,
      ENTITY_TYPE: ENTITY_TYPE.WIDGET,
      privateWidgets: {
        ...widget.privateWidgets,
      },
      propertyOverrideDependency,
      overridingPropertyPaths,
      type: widget.type,
      ...dynamicPathsList,
      ...setterConfig,
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
  loadingEntities: LoadingEntitiesState,
  layoutSystemType: LayoutSystemTypes = LayoutSystemTypes.FIXED,
  isMobile = false,
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
  dataTreeWidget["isLoading"] = loadingEntities.has(widget.widgetName);

  const { componentHeight, componentWidth } = getComponentDimensions(
    dataTreeWidget,
    layoutSystemType,
    isMobile,
  );

  return {
    unEvalEntity: {
      ...dataTreeWidget,
      componentHeight,
      componentWidth,
      type: widget.type,
    },
    configEntity: entityConfig,
  };
};
