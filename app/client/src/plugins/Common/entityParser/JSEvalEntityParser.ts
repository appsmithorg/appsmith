import { validJSBodyRegex } from "workers/Evaluation/JSObject";
import type { EntityParser } from ".";
import type {
  JSActionEntityConfig,
  JSActionEntity as TJSActionEntity,
} from "entities/DataTree/types";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { parseJSObject } from "@shared/ast";
import { set } from "lodash";

export class JSEvalEntityParser implements EntityParser {
  parse(entity: TJSActionEntity, entityConfig: JSActionEntityConfig) {
    const unsuccessfullyParsedObject = {
      parsedEntity: entity,
      parsedEntityConfig: {},
    };
    const body = entity.body;
    const entityName = entity.name;
    const correctFormat = validJSBodyRegex.test(body);
    const isEmptyBody = body.trim() === "";
    try {
      if (!correctFormat && !isEmptyBody)
        throw new Error("Start object with export default");
      const { parsedObject, success } = parseJSObject(body);
      if (!success) throw new Error("Failed to parse object");
      const parsedJSEntity: Partial<TJSActionEntity> = {};
      for (const parsedKeyValuePair of parsedObject) {
        const { key, type, value } = parsedKeyValuePair;
        const isStringRepresentation =
          key.startsWith("'") || key.startsWith('"');
        const parsedKey = isStringRepresentation ? key.slice(1, -1) : key;
        if (type === "Literal") {
          parsedJSEntity[parsedKey] = value;
        } else {
          const data = entity[parsedKey].data;
          parsedJSEntity[`${parsedKey}.data`] = entity[`${parsedKey}.data`] =
            data;
          parsedJSEntity[parsedKey] = entity[parsedKey] = value;
        }
      }
      return {
        parsedEntity: parsedJSEntity,
        parsedEntityConfig: {},
      };
    } catch (e) {
      const error = {
        type: EvalErrorTypes.PARSE_JS_ERROR,
        context: {
          entity: entity,
          propertyPath: entityName + ".body",
        },
        message: (e as Error).message,
      };
      // Log evaluation errors
      return unsuccessfullyParsedObject;
    }
  }
}
