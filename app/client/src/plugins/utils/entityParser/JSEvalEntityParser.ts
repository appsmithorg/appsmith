import type { EntityParser } from ".";
import type {
  // JSActionEntityConfig,
  JSActionEntity as TJSActionEntity,
} from "entities/DataTree/types";

export class JSEvalEntityParser implements EntityParser {
  parse(entity: TJSActionEntity /*, entityConfig: JSActionEntityConfig */) {
    return {
      parsedEntity: entity,
      parsedEntityConfig: {},
    };
  }
}
