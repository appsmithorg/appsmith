import type { TParsedJSProperty } from "@shared/ast";
import { parseJSObject } from "@shared/ast";
import type { JSEntity } from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import { mapValues } from "lodash";
import { validJSBodyRegex } from "workers/Evaluation/JSObject";
import type { createEntityTree } from "./createEntityTree";

export function setParsedJSEntities(
  entityTree: ReturnType<typeof createEntityTree>,
  parsedJSActions: Record<string, TJSEntityState>,
) {
  for (const entity of Object.values(entityTree)) {
    if (!isJSEntity(entity)) continue;
    const jsEntityName = entity.getName();
    const parsedEntity = parsedJSActions[jsEntityName];
    entity.setParsedEntity(parsedEntity);
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

export class ParsedJSObjectState {
  static parsedJSEntities: Record<string, TJSEntityState> = {};
  static parsedEntitiesConfig: Record<string, TJSEntityStateConfig> = {};
  static parseJSEntities(jsEntities: Record<string, JSEntity>) {
    const parsedEntities: Record<string, TJSEntityState> = {};

    for (const jsEntity of Object.values(jsEntities)) {
      const jsEntityBody = jsEntity.getRawEntity().body;
      const jsEntityName = jsEntity.getName();
      const cachedJSEntity = ParsedJSObjectState.parsedJSEntities[jsEntityName];
      // When body is the unchanged, used cached value
      if (cachedJSEntity && jsEntity.isEqual(cachedJSEntity.body)) {
        parsedEntities[jsEntityName] = cachedJSEntity;
        continue;
      }
      const { parsedObject } =
        ParsedJSObjectState.parseJSObjectBody(jsEntityBody);
      const JSEntityState: TJSEntityState = {
        body: jsEntityBody,
        ...convertParsedJSObjectPropertiesToValues(parsedObject),
      };

      ParsedJSObjectState.parsedJSEntities[jsEntityName] = JSEntityState;
      ParsedJSObjectState.parsedEntitiesConfig[jsEntityName] = parsedObject;
      parsedEntities[jsEntityName] = JSEntityState;
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
}

export type TJSEntityState = { body: string } & Record<string, string>;

type TJSEntityStateConfig = Record<string, TParsedJSProperty>;
