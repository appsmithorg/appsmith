import React, { memo, useEffect } from "react";
import EntityProperty, { EntityPropertyProps } from "./EntityProperty";
import { isFunction } from "lodash";
import {
  entityDefinitions,
  EntityDefinitionsOptions,
} from "utils/autocomplete/EntityDefinitions";
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

export const CurrentPageEntityProperties = memo(
  (props: {
    entityType: ENTITY_TYPE;
    entityName: string;
    step: number;
    entity?: any;
  }) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
    );
    useEffect(() => {
      PerformanceTracker.stopTracking(
        PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
      );
    });

    const dataTree: DataTree = useSelector(getDataTree);
    const entity: any = dataTree[props.entityName];

    if (!entity) return null;

    let config: any;
    let entityProperties: Array<EntityPropertyProps> = [];
    switch (props.entityType) {
      case ENTITY_TYPE.ACTION:
        config = (entityDefinitions.ACTION as any)(entity as DataTreeAction);
        if (config) {
          entityProperties = Object.keys(config)
            .filter((k) => k.indexOf("!") === -1)
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
          EntityDefinitionsOptions,
          | "CANVAS_WIDGET"
          | "ICON_WIDGET"
          | "SKELETON_WIDGET"
          | "TABS_MIGRATOR_WIDGET"
        > = entity.type;
        config = entityDefinitions[type];
        if (!config) {
          return null;
        }

        if (isFunction(config)) config = config(entity);

        entityProperties = Object.keys(config)
          .filter((k) => k.indexOf("!") === -1)
          .map((widgetProperty) => {
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
        {entityProperties.map((entityProperty) => (
          <EntityProperty
            key={entityProperty.propertyName}
            {...entityProperty}
          />
        ))}
      </>
    );
  },
);

CurrentPageEntityProperties.displayName = "CurrentPageEntityProperties";

(CurrentPageEntityProperties as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default Sentry.withProfiler(CurrentPageEntityProperties);
