import type {
  DataTreeEntity,
  DataTreeEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import type {
  JSActionEntityConfig,
  JSActionEntity as TJSActionEntity,
} from "entities/DataTree/types";
import type { TParsedJSProperty } from "@shared/ast";

export interface EntityParser {
  parse<T extends DataTreeEntity, K extends DataTreeEntityConfig>(
    entity: T,
    entityConfig: K,
  ): ParsedEntity<T, K>;
  parse<T extends TJSActionEntity, K extends JSActionEntityConfig>(
    entity: T,
    entityConfig: K,
  ): ParsedEntity<T, K>;
}

export type TParsedJSEntity = Record<string, string> & {
  body: string;
};

type TParsedJSEntityConfig = Record<string, TParsedJSProperty>;

export type ParsedJSCache = {
  parsedEntity: ParsedEntity<TJSActionEntity, TParsedJSEntityConfig>;
  parsedEntityConfig: TParsedJSEntityConfig;
};

export type ParsedEntity<T, K> = {
  parsedEntity: T & { [x: string]: unknown };
  parsedEntityConfig: K & { [x: string]: unknown };
};

export class DefaultEntityParser implements EntityParser {
  parse<T extends DataTreeEntity>(entity: T) {
    return {
      parsedEntity: entity,
      parsedEntityConfig: {},
    };
  }
}
