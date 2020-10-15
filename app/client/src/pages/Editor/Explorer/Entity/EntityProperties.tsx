import React, { useEffect } from "react";
import EntityProperty, { EntityPropertyProps } from "./EntityProperty";
import { isFunction } from "lodash";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { WidgetType } from "constants/WidgetConstants";
import {
  ENTITY_TYPE,
  DataTreeAction,
  DataTree,
} from "entities/DataTree/dataTreeFactory";
import { useSelector } from "react-redux";
import { getDataTree } from "selectors/dataTreeSelectors";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";

export const EntityProperties = (props: {
  entityType: ENTITY_TYPE;
  entityName: string;
  isCurrentPage: boolean;
  step: number;
  entity?: any;
}) => {
  PerformanceTracker.startTracking(
    PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
    undefined,
    true,
  );
  useEffect(() => {
    PerformanceTracker.stopTracking(
      PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
    );
  });
  let entity: any;
  const dataTree: DataTree = useSelector(getDataTree);
  if (props.isCurrentPage && dataTree[props.entityName]) {
    entity = dataTree[props.entityName];
  } else if (props.entity) {
    entity = props.entity;
  } else {
    return null;
  }
  let config: any;
  let entityProperties: Array<EntityPropertyProps> = [];
  switch (props.entityType) {
    case ENTITY_TYPE.ACTION:
      config = entityDefinitions.ACTION(entity as DataTreeAction);
      if (config) {
        entityProperties = Object.keys(config)
          .filter(k => k.indexOf("!") === -1)
          .map((actionProperty: string) => {
            let value = entity[actionProperty];
            if (actionProperty === "isLoading") {
              value = entity.isLoading;
            }
            if (actionProperty === "run") {
              value = "Function";
              actionProperty = actionProperty + "()";
            }
            if (actionProperty === "data") {
              value = entity.data;
            }
            return {
              propertyName: actionProperty,
              entityName: props.entityName,
              value,
              step: props.step,
            };
          });
      }
      break;
    case ENTITY_TYPE.WIDGET:
      const type: Exclude<
        Partial<WidgetType>,
        "CANVAS_WIDGET" | "ICON_WIDGET"
      > = entity.type;
      config = entityDefinitions[type];

      if (isFunction(config)) config = config(entity);

      entityProperties = Object.keys(config)
        .filter(k => k.indexOf("!") === -1)
        .map(widgetProperty => {
          return {
            propertyName: widgetProperty,
            entityName: entity.widgetName,
            value: entity[widgetProperty],
            step: props.step,
          };
        });
      break;
  }
  return (
    <>
      {entityProperties.map(entityProperty => (
        <EntityProperty key={entityProperty.propertyName} {...entityProperty} />
      ))}
    </>
  );
};

export default Sentry.withProfiler(EntityProperties);
