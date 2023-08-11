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
  ): ParsedEntity<T>;
  parse<T extends TJSActionEntity, K extends JSActionEntityConfig>(
    entity: T,
    entityConfig: K,
  ): ParsedEntity<T>;
}

export type TParsedJSEntity = Record<string, string> & {
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
