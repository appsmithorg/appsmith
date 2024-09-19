import { ENTITY_TYPE, type JSActionEntity } from "ee/entities/DataTree/types";
import WidgetFactory from "WidgetProvider/factory";
import type {
  DataTreeEntityObject,
  JSActionEntityConfig,
  WidgetEntity,
} from "ee/entities/DataTree/types";
import { isFunction } from "lodash";
import { entityDefinitions } from "ee/utils/autocomplete/EntityDefinitions";
import ConfigTreeActions from "utils/configTree";
import store from "store";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";

export interface EntityProperty {
  propertyName: string;
  entityName: string;
  value: unknown;
  entityType: string;
}

export const getPropsForJSActionEntity = (
  jsActionEntity: JSActionEntity,
  entityName: string,
) => {
  const properties: Record<string, unknown> = {};

  const configTree = ConfigTreeActions.getConfigTree();
  const jsActionEntityConfig = configTree[entityName] as
    | JSActionEntityConfig
    | undefined;

  const variableNames = jsActionEntityConfig?.variables;

  if (variableNames && variableNames.length > 0) {
    for (let i = 0; i < variableNames.length; i++) {
      const variableName = variableNames[i];

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
  entityProperties: EntityProperty[],
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

enum ActionEntityPublicProperties {
  run = "run",
  clear = "clear",
  isLoading = "isLoading",
  data = "data",
}

const getActionBindings = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity: any,
  entityProperties: EntityProperty[],
  entityType: string,
  entityName: string,
) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (entityDefinitions.ACTION as any)(entity as any);

  entityProperties = Object.keys(config || {})
    .filter((k) => k.indexOf("!") === -1)
    .map((actionProperty) => {
      let value = entity[actionProperty];

      if (
        actionProperty === ActionEntityPublicProperties.run ||
        actionProperty === ActionEntityPublicProperties.clear
      ) {
        value = "Function";
        actionProperty = actionProperty + "()";
      }

      return {
        propertyName: actionProperty,
        entityName: entityName,
        value,
        entityType,
      };
    });

  return entityProperties;
};

function getWidgetBindings(
  entity: DataTreeEntityObject,
  entityProperties: EntityProperty[],
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
  let entityProperties: EntityProperty[] = [];

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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entityProperties: any,
    entityType: string,
    entityName: string,
  ) => EntityProperty[]
> = {
  [ENTITY_TYPE.JSACTION]: getJSActionBindings,
  [ENTITY_TYPE.ACTION]: getActionBindings,
  [ENTITY_TYPE.WIDGET]: getWidgetBindings,
};
