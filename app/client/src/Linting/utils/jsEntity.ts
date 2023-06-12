import type { TParsedJSProperty } from "@shared/ast";
import { parseJSObject } from "@shared/ast";
import type { JSEntity } from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import { find, mapValues } from "lodash";
import { validJSBodyRegex } from "workers/Evaluation/JSObject";
import type { createEntityTree } from "./entityTree";

export type TJSEntityState = { body: string } & Record<string, string>;

type TJSEntityStateConfig = Record<string, TParsedJSProperty>;

export function setParsedJSEntities(
  entityTree: ReturnType<typeof createEntityTree>,
  parsedJSActions: ReturnType<typeof ParsedJSEntities.parseJSEntities>,
) {
  for (const entity of Object.values(entityTree)) {
    if (!isJSEntity(entity)) continue;
    const jsEntityName = entity.getName();
    const parsedEntity = parsedJSActions[jsEntityName];
    entity.setParsedEntity(parsedEntity.getEntity());
  }
}

function convertParsedJSObjectPropertiesToValues(
  parsedJSObject: Record<string, TParsedJSProperty>,
) {
  return mapValues(parsedJSObject, (parsedProperty) => {
    return parsedProperty.value;
  });
}

function isValidJSBody(jsBody: string) {
  return !!jsBody.trim() && validJSBodyRegex.test(jsBody);
}

type TParsedJSEntity = {
  getEntity(): TJSEntityState;
  getEntityConfig(): TJSEntityStateConfig;
};
class ParsedJSEntity implements TParsedJSEntity {
  private entity: TJSEntityState = { body: "" };
  private entityConfig: TJSEntityStateConfig = {};

  constructor(
    jsObjectBody: string,
    parsedObject: Record<string, TParsedJSProperty>,
  ) {
    const JSEntityState: TJSEntityState = {
      body: jsObjectBody,
      ...convertParsedJSObjectPropertiesToValues(parsedObject),
    };
    this.entity = JSEntityState;
    this.entityConfig = parsedObject;
  }
  getEntity(): TJSEntityState {
    return this.entity;
  }
  getEntityConfig(): TJSEntityStateConfig {
    return this.entityConfig;
  }
}

export class ParsedJSEntities {
  static parsedJSEntities: Record<string, ParsedJSEntity> = {};

  static parseJSEntities(jsEntities: Record<string, JSEntity>) {
    const parsedEntities: Record<string, ParsedJSEntity> = {};

    for (const jsEntity of Object.values(jsEntities)) {
      const jsEntityBody = jsEntity.getRawEntity().body;
      const jsEntityName = jsEntity.getName();
      const cachedJSEntity = ParsedJSEntities.parsedJSEntities[jsEntityName];
      // When body is the unchanged, used cached value
      if (cachedJSEntity && jsEntity.isEqual(cachedJSEntity.getEntity().body)) {
        parsedEntities[jsEntityName] = cachedJSEntity;
        continue;
      }
      const { parsedObject } = ParsedJSEntities.parseJSObjectBody(jsEntityBody);
      const parsedJSEntity = new ParsedJSEntity(jsEntityBody, parsedObject);

      ParsedJSEntities.parsedJSEntities[jsEntityName] = parsedJSEntity;
      parsedEntities[jsEntityName] = parsedJSEntity;
    }

    return parsedEntities;
  }
  private static parseJSObjectBody(jsBody: string) {
    let response:
      | { success: false; parsedObject: Record<string, never> }
      | { success: true; parsedObject: Record<string, TParsedJSProperty> } = {
      success: false,
      parsedObject: {},
    };

    if (isValidJSBody(jsBody)) {
      const { parsedObject: parsedProperties, success } = parseJSObject(jsBody);
      if (success) {
        response = {
          success: true,
          parsedObject: parsedProperties.reduce(
            (acc: Record<string, TParsedJSProperty>, property) => {
              const updatedProperties = { ...acc, [property.key]: property };
              return updatedProperties;
            },
            {},
          ),
        };
      }
    }
    return response;
  }
  static getParsedJSEntity(jsObjectName: string) {
    return find(ParsedJSEntities.parsedJSEntities, jsObjectName);
  }
}
