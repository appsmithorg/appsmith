import type {
  JSActionEntityConfig,
  JSActionEntity as TJSActionEntity,
} from "entities/DataTree/types";
import { EvaluationSubstitutionType } from "entities/DataTree/types";
import type { TParsedJSProperty } from "@shared/ast";
import { isJSFunctionProperty } from "@shared/ast";
import { parseJSObject } from "@shared/ast";
import type { JSVarProperty } from "@shared/ast";
import type { JSFunctionProperty } from "@shared/ast";
import { uniq } from "lodash";
import { validJSBodyRegex } from "workers/Evaluation/JSObject";
import type { EntityParser, ParsedEntity, TParsedJSEntity } from ".";

export class JSLintEntityParser implements EntityParser {
  #parsedJSCache: ParsedEntity<TJSActionEntity> = {
    parsedEntity: {},
    parsedEntityConfig: {},
  };
  parse(entity: TJSActionEntity, entityConfig: JSActionEntityConfig) {
    const jsEntityBody = entity.body;
    if (
      this.#parsedJSCache &&
      jsEntityBody === this.#parsedJSCache.parsedEntity.body
    ) {
      return {
        parsedEntity: this.#parsedJSCache.parsedEntity,
        parsedEntityConfig: this.#parsedJSCache.parsedEntityConfig,
      };
    }

    const { parsedObject, success } = this.#parseJSObjectBody(jsEntityBody);

    const parsedJSEntityConfig: Record<string, unknown> = {};
    const parsedJSEntity: TParsedJSEntity = { body: jsEntityBody };

    if (success) {
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
            type,
          } as JSFunctionProperty;
        } else if (type !== "literal") {
          parsedJSEntityConfig[propertyName] = {
            position: position,
            value: rawContent,
            type,
          } as JSVarProperty;
        }
      }
    }
    // Save parsed entity to cache
    this.#parsedJSCache = {
      parsedEntity: parsedJSEntity,
      parsedEntityConfig: parsedJSEntityConfig,
    };

    // update entity and entity config
    const requiredProps = ["actionId", "body", "ENTITY_TYPE"];
    for (const property of Object.keys(entity)) {
      if (requiredProps.includes(property)) continue;
      delete entity[property];
      delete entityConfig.reactivePaths[property];
    }

    for (const [propertyName, propertyValue] of Object.entries(
      parsedJSEntity,
    )) {
      entity[propertyName] = propertyValue;
      entityConfig.reactivePaths[propertyName] =
        EvaluationSubstitutionType.TEMPLATE;
      const propertyConfig = parsedJSEntityConfig[
        propertyName
      ] as TParsedJSProperty;
      if (propertyConfig && isJSFunctionProperty(propertyConfig)) {
        entity[`${propertyName}.data`] = {};
      }
    }
    return this.#parsedJSCache;
  }

  #isValidJSBody(jsBody: string) {
    return !!jsBody.trim() && validJSBodyRegex.test(jsBody);
  }

  #parseJSObjectBody = (jsBody: string) => {
    const unsuccessfulParsingResponse = {
      success: false,
      parsedObject: {} as Record<string, TParsedJSProperty>,
    };
    if (!this.#isValidJSBody(jsBody)) return unsuccessfulParsingResponse;
    const { parsedObject: parsedProperties, success } = parseJSObject(jsBody);
    if (!success) return unsuccessfulParsingResponse;
    // When a parsed object has duplicate keys, the jsobject is invalid and its body (not individual properties) needs to be linted
    // so we return an empty object
    const allPropertyKeys = parsedProperties.map((property) => property.key);
    const uniqueKeys = uniq(allPropertyKeys);
    const hasUniqueKeys = allPropertyKeys.length === uniqueKeys.length;
    if (!hasUniqueKeys) return unsuccessfulParsingResponse;
    return {
      success: true,
      parsedObject: parsedProperties.reduce(
        (acc: Record<string, TParsedJSProperty>, property) => {
          const updatedProperties = { ...acc, [property.key]: property };
          return updatedProperties;
        },
        {},
      ),
    };
  };
}
