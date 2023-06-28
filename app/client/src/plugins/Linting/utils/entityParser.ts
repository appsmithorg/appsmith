import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import type { JSActionEntity as TJSActionEntity } from "entities/DataTree/types";
import type { TParsedJSProperty } from "@shared/ast";
import { isJSFunctionProperty } from "@shared/ast";
import { parseJSObject } from "@shared/ast";
import type { JSVarProperty } from "@shared/ast";
import type { JSFunctionProperty } from "@shared/ast";
import { uniq } from "lodash";
import { validJSBodyRegex } from "workers/Evaluation/JSObject";

export interface EntityParser {
  parse(entity: DataTreeEntity): {
    parsedEntity: Record<string, unknown>;
    parsedEntityConfig: Record<string, unknown>;
  };
}

type TParsedJSEntity = Record<string, string> & {
  body: string;
};

type TParsedJSEntityConfig = Record<string, TParsedJSProperty>;

export type parsedJSCache = Record<
  string,
  { parsedEntity: TParsedJSEntity; parsedEntityConfig: TParsedJSEntityConfig }
>;

class JSLintEntityParser implements EntityParser {
  #parsedJSCache: parsedJSCache = {};
  parse(entity: TJSActionEntity) {
    const jsEntityBody = entity.body;
    const jsEntityName = entity.getName();
    const cachedParsedJSEntity = this.#parsedJSCache[jsEntityName];
    if (
      cachedParsedJSEntity &&
      entity.isEqual(cachedParsedJSEntity.parsedEntity.body)
    ) {
      return {
        parsedEntity: cachedParsedJSEntity.parsedEntity,
        parsedEntityConfig: cachedParsedJSEntity.parsedEntityConfig,
      };
    }

    const { parsedObject, success } = this.#parseJSObjectBody(jsEntityBody);

    if (!success) {
      // Save parsed entity to cache
      this.#parsedJSCache[jsEntityName] = {
        parsedEntity: { body: jsEntityBody },
        parsedEntityConfig: {},
      };
      return {
        parsedEntity: { body: jsEntityBody },
        parsedEntityConfig: {},
      };
    }

    const parsedJSEntity: TParsedJSEntity = {
      body: jsEntityBody,
    };
    const parsedJSEntityConfig: TParsedJSEntityConfig = {};

    for (const [propertyName, parsedPropertyDetails] of Object.entries(
      parsedObject,
    )) {
      const { position, rawContent, type, value } = parsedPropertyDetails;
      parsedJSEntity[propertyName] = value;
      if (isJSFunctionProperty(parsedPropertyDetails)) {
        parsedJSEntityConfig[propertyName] = {
          isMarkedAsync: parsedPropertyDetails.isMarkedAsync,
          position,
          value: rawContent,
        } as JSFunctionProperty;
      } else if (type !== "literal") {
        parsedJSEntityConfig[propertyName] = {
          position: position,
          value: rawContent,
        } as JSVarProperty;
      }
    }

    // Save parsed entity to cache
    this.#parsedJSCache[jsEntityName] = {
      parsedEntity: parsedJSEntity,
      parsedEntityConfig: parsedJSEntityConfig,
    };

    return {
      parsedEntity: parsedJSEntity,
      parsedEntityConfig: parsedJSEntityConfig,
    };
  }

  #isValidJSBody(jsBody: string) {
    return !!jsBody.trim() && validJSBodyRegex.test(jsBody);
  }

  #parseJSObjectBody = (jsBody: string) => {
    const unsuccessfulParsingResponse = {
      success: false,
      parsedObject: {},
    } as const;
    let response:
      | { success: false; parsedObject: Record<string, never> }
      | { success: true; parsedObject: Record<string, TParsedJSProperty> } =
      unsuccessfulParsingResponse;

    if (this.#isValidJSBody(jsBody)) {
      const { parsedObject: parsedProperties, success } = parseJSObject(jsBody);
      if (success) {
        // When a parsed object has duplicate keys, the jsobject is invalid and its body (not individual properties) needs to be linted
        // so we return an empty object
        const allPropertyKeys = parsedProperties.map(
          (property) => property.key,
        );
        const uniqueKeys = uniq(allPropertyKeys);
        const hasUniqueKeys = allPropertyKeys.length === uniqueKeys.length;
        if (hasUniqueKeys) {
          response = {
            success: true,
            parsedObject: parsedProperties.reduce(
              (acc: Record<string, TParsedJSProperty>, property) => {
                const updatedProperties = { ...acc, [property.key]: property };
                return updatedProperties;
              },
              {},
            ),
          } as const;
        }
      }
    }
    return response;
  };
}

export const jsLintEntityParser = new JSLintEntityParser();
