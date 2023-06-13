import type { TParsedJSProperty } from "@shared/ast";
import { parseJSObject } from "@shared/ast";
import type { JSEntity } from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import { mapValues } from "lodash";
import { validJSBodyRegex } from "workers/Evaluation/JSObject";
import type { createEntityTree } from "./entityTree";

export const parsedJSEntitiesCache: Record<string, ParsedJSEntity> = {};

export type TJSEntityState = { body: string } & Record<string, string>;
type TJSEntityStateConfig = Record<string, TParsedJSProperty>;

class ParsedJSEntity {
  private entity: TJSEntityState = { body: "" };
  private entityConfig: TJSEntityStateConfig = {};

  constructor(
    jsObjectBody: string,
    parsedJSObject: Record<string, TParsedJSProperty>,
  ) {
    const JSEntityState: TJSEntityState = {
      body: jsObjectBody,
      ...convertParsedJSObjectPropertiesToValues(parsedJSObject),
    };
    this.entity = JSEntityState;
    this.entityConfig = parsedJSObject;
  }
  getParsedEntity(): TJSEntityState {
    return this.entity;
  }
  getParsedEntityConfig(): TJSEntityStateConfig {
    return this.entityConfig;
  }
}

export function setParsedJSEntities(
  entityTree: ReturnType<typeof createEntityTree>,
) {
  for (const entity of Object.values(entityTree)) {
    if (!isJSEntity(entity)) continue;
    const parsedEntity = parseJSEntity(entity);
    entity.setParsedEntity(parsedEntity.getParsedEntity());
  }
  return entityTree;
}

function isValidJSBody(jsBody: string) {
  return !!jsBody.trim() && validJSBodyRegex.test(jsBody);
}

export function parseJSEntity(jsEntity: JSEntity) {
  const jsEntityBody = jsEntity.getRawEntity().body;
  const jsEntityName = jsEntity.getName();
  const cachedJSEntity = parsedJSEntitiesCache[jsEntityName];
  // When body is the unchanged, used cached value
  if (
    cachedJSEntity &&
    jsEntity.isEqual(cachedJSEntity.getParsedEntity().body)
  ) {
    return cachedJSEntity;
  }

  const { parsedObject } = parseJSObjectBody(jsEntityBody);
  const parsedJSEntity = new ParsedJSEntity(jsEntityBody, parsedObject);

  parsedJSEntitiesCache[jsEntityName] = parsedJSEntity;

  return parsedJSEntity;
}

function parseJSObjectBody(jsBody: string) {
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

export function getParsedJSEntity(jsObjectName: string) {
  return parsedJSEntitiesCache[jsObjectName];
}
function convertParsedJSObjectPropertiesToValues(
  parsedJSObject: Record<string, TParsedJSProperty>,
) {
  return mapValues(parsedJSObject, (parsedProperty) => {
    return parsedProperty.value;
  });
}
