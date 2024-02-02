import {
  ENTITY_TYPE,
  type JSActionEntity,
} from "@appsmith/entities/DataTree/types";
import WidgetFactory from "WidgetProvider/factory";
import type {
  DataTreeEntityObject,
  WidgetEntity,
} from "@appsmith/entities/DataTree/types";
import { isEmpty, isFunction } from "lodash";
import { entityDefinitions } from "@appsmith/utils/autocomplete/EntityDefinitions";

export const getPropsForJSActionEntity = (
  jsActionEntity: JSActionEntity,
): Record<string, string> => {
  const properties: Record<string, any> = {};
  const actions = jsActionEntity.actions;
  if (actions && actions.length > 0)
    for (let i = 0; i < jsActionEntity.actions.length; i++) {
      const action = jsActionEntity.actions[i];
      properties[action.name + "()"] = "Function";
      const data = jsActionEntity[action.name]?.data;
      if (data) {
        properties[action.name + ".data"] = data[action.id];
      }
    }
  const variablesProps = jsActionEntity.variables;
  if (variablesProps && variablesProps.length > 0) {
    for (let i = 0; i < variablesProps.length; i++) {
      const variableName = variablesProps[i];
      properties[variableName] = jsActionEntity[variableName];
    }
  }
  return properties;
};

const getJSActionBindings = (
  entity: DataTreeEntityObject,
  entityProperties: any,
  entityType: string,
) => {
  const jsCollection = entity as JSActionEntity;
  const properties = getPropsForJSActionEntity(jsCollection);
  if (properties) {
    entityProperties = Object.keys(properties).map((actionProperty: string) => {
      const value = properties[actionProperty];
      return {
        propertyName: actionProperty,
        entityName: jsCollection.config.name,
        value: value,
        entityType,
      };
    });
  }
  return entityProperties;
};

const getActionBindings = (
  entity: any,
  entityProperties: any,
  entityType: string,
  entityName?: string,
) => {
  const config = (entityDefinitions.ACTION as any)(entity as any);

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
          if (isEmpty(entity.data) || !entity.data.hasOwnProperty("body")) {
            value = {};
          } else {
            value = entity.data.body;
          }
        }
        return {
          propertyName: actionProperty,
          entityName: entityName,
          value,
          entityType,
        };
      });
  }
  return entityProperties;
};

export function getEntityProperties({
  entity,
  entityName,
  entityType,
}: {
  entityType?: string;
  entity: DataTreeEntityObject;
  entityName?: string;
}) {
  let entityProperties: any[] = [];
  switch (entityType) {
    case ENTITY_TYPE.JSACTION:
      entityProperties = getJSActionBindings(
        entity,
        entityProperties,
        entityType,
      );
      break;
    case ENTITY_TYPE.ACTION:
      entityProperties = getActionBindings(
        entity,
        entityProperties,
        entityType,
        entityName,
      );
      break;
    case ENTITY_TYPE.WIDGET:
      const widgetEntity = entity as WidgetEntity;
      const type = widgetEntity.type;
      let config = WidgetFactory.getAutocompleteDefinitions(type);
      if (!config) break;

      if (isFunction(config)) config = config(widgetEntity);
      const settersConfig =
        WidgetFactory.getWidgetSetterConfig(type)?.__setters;

      entityProperties = Object.keys(config)
        .filter((k) => k.indexOf("!") === -1)
        .filter((k) => settersConfig && !settersConfig[k])
        .map((widgetProperty) => {
          return {
            propertyName: widgetProperty,
            entityName: widgetEntity.widgetName,
            value: widgetEntity[widgetProperty],
            entityType,
          };
        });
      break;
  }
  return entityProperties;
}
