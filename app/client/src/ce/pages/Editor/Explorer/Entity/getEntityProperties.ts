import {
  ENTITY_TYPE,
  type JSActionEntity,
} from "@appsmith/entities/DataTree/types";
import WidgetFactory from "WidgetProvider/factory";
import type {
  DataTreeEntityObject,
  JSActionEntityConfig,
  WidgetEntity,
} from "@appsmith/entities/DataTree/types";
import { isEmpty, isFunction } from "lodash";
import { entityDefinitions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import ConfigTreeActions from "utils/configTree";
import store from "store";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";

export const getPropsForJSActionEntity = (
  jsActionEntity: JSActionEntity,
  entityName: string,
): Record<string, string> => {
  const properties: Record<string, any> = {};

  const configTree = ConfigTreeActions.getConfigTree();
  const jsActionEntityConfig = configTree[entityName] as JSActionEntityConfig;

  const variablesProps = jsActionEntityConfig.variables;
  if (variablesProps && variablesProps.length > 0) {
    for (let i = 0; i < variablesProps.length; i++) {
      const variableName = variablesProps[i];
      properties[variableName] = jsActionEntity[variableName];
    }
  }

  const jsActions = store.getState().entities.jsActions as JSCollectionData[];
  const jsCollection = jsActions.find((js) => js.config.name === entityName);

  const actions = jsCollection?.config.actions;
  if (actions && actions.length > 0)
    for (let i = 0; i < jsCollection.config.actions.length; i++) {
      const action = jsCollection.config.actions[i];
      properties[action.name + "()"] = "Function";
      properties[action.name + ".data"] = jsCollection?.data?.[action.id];
    }

  return properties;
};

const getJSActionBindings = (
  entity: DataTreeEntityObject,
  entityProperties: any,
  entityType: string,
  entityName: string,
) => {
  const jsCollection = entity as JSActionEntity;
  const properties = getPropsForJSActionEntity(jsCollection, entityName);
  if (properties) {
    entityProperties = Object.keys(properties).map((actionProperty: string) => {
      const value = properties[actionProperty];
      return {
        propertyName: actionProperty,
        entityName: entityName,
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
  entityName: string,
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

function getWidgetBindings(
  entity: DataTreeEntityObject,
  entityProperties: any,
  entityType: string,
) {
  const widgetEntity = entity as WidgetEntity;
  const type = widgetEntity.type;
  let config = WidgetFactory.getAutocompleteDefinitions(type);
  if (!config) return entityProperties;

  if (isFunction(config)) config = config(widgetEntity);
  const settersConfig = WidgetFactory.getWidgetSetterConfig(type)?.__setters;

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
  return entityProperties;
}

export function getEntityProperties({
  entity,
  entityName,
  entityType,
}: {
  entityType: string;
  entity: DataTreeEntityObject;
  entityName: string;
}) {
  let entityProperties: any[] = [];
  if (entityType in getEntityPropertiesMap) {
    entityProperties = getEntityPropertiesMap[entityType](
      entity,
      entityProperties,
      entityType,
      entityName,
    );
  }
  return entityProperties;
}

export const getEntityPropertiesMap: Record<
  string,
  (
    entity: DataTreeEntityObject,
    entityProperties: any,
    entityType: string,
    entityName: string,
  ) => any
> = {
  [ENTITY_TYPE.JSACTION]: getJSActionBindings,
  [ENTITY_TYPE.ACTION]: getActionBindings,
  [ENTITY_TYPE.WIDGET]: getWidgetBindings,
};
