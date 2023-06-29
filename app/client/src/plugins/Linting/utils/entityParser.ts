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
  parse<T extends DataTreeEntity>(entity: T): ParsedEntity<T>;
  parse<T extends TJSActionEntity>(entity: T): ParsedEntity<T>;
}

type TParsedJSEntity = Record<string, string> & {
  body: string;
};

type TParsedJSEntityConfig = Record<string, TParsedJSProperty>;

export type ParsedJSCache = {
  parsedEntity: ParsedEntity<TJSActionEntity>;
  parsedEntityConfig: TParsedJSEntityConfig;
};

export type ParsedEntity<T> = {
  parsedEntity: Partial<T>;
  parsedEntityConfig: Record<string, unknown>;
};

export class DefaultEntityParser implements EntityParser {
  parse<T extends DataTreeEntity>(entity: T) {
    return {
      parsedEntity: entity,
      parsedEntityConfig: {},
    };
  }
}

export class JSLintEntityParser implements EntityParser {
  #parsedJSCache: ParsedEntity<TJSActionEntity> = {
    parsedEntity: {},
    parsedEntityConfig: {},
  };
  parse<T extends TJSActionEntity>(entity: T) {
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

    if (!success) {
      // Save parsed entity to cache
      this.#parsedJSCache = {
        parsedEntity: { body: jsEntityBody },
        parsedEntityConfig: {},
      };
      return this.#parsedJSCache;
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

    // Save parsed entity to cache
    this.#parsedJSCache = {
      parsedEntity: parsedJSEntity,
      parsedEntityConfig: parsedJSEntityConfig,
    };

    return this.#parsedJSCache;
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
