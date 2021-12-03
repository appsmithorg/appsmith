import React, { memo, useEffect } from "react";
import EntityProperty, { EntityPropertyProps } from "./EntityProperty";
import { isFunction } from "lodash";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { WidgetType } from "constants/WidgetConstants";
import { ENTITY_TYPE, DataTreeAction } from "entities/DataTree/dataTreeFactory";
import { useSelector } from "react-redux";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as Sentry from "@sentry/react";
import { AppState } from "reducers";
import { getPropsForJSActionEntity } from "utils/autocomplete/EntityDefinitions";
import { isEmpty } from "lodash";

export const EntityProperties = memo(
  (props: {
    entityType: ENTITY_TYPE;
    entityName: string;
    pageId: string;
    step: number;
    entity?: any;
    entityId: string;
  }) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
    );
    useEffect(() => {
      PerformanceTracker.stopTracking(
        PerformanceTransactionName.ENTITY_EXPLORER_ENTITY,
      );
    });
    let entity: any;
    const widgetEntity = useSelector((state: AppState) => {
      const pageWidgets = state.ui.pageWidgets[props.pageId];
      if (pageWidgets) {
        return pageWidgets[props.entityId];
      }
    });

    if (props.pageId && widgetEntity) {
      entity = widgetEntity;
    } else if (props.entity) {
      entity = props.entity;
    } else {
      return null;
    }
    let config: any;
    let entityProperties: Array<EntityPropertyProps> = [];
    switch (props.entityType) {
      case ENTITY_TYPE.JSACTION:
        const jsAction = entity.config;
        const properties = getPropsForJSActionEntity(jsAction);
        if (properties) {
          entityProperties = Object.keys(properties).map(
            (actionProperty: string) => {
              const value = properties[actionProperty];
              return {
                propertyName: actionProperty,
                entityName: jsAction.name,
                value: value,
                step: props.step,
              };
            },
          );
        }
        break;
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
              if (actionProperty === "clear") {
                value = "Function";
                actionProperty = actionProperty + "()";
              }
              if (actionProperty === "data") {
                if (
                  isEmpty(entity.data) ||
                  !entity.data.hasOwnProperty("body")
                ) {
                  value = "{}";
                } else {
                  value = entity.data.body;
                }
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

EntityProperties.displayName = "EntityProperties";

(EntityProperties as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default Sentry.withProfiler(EntityProperties);
