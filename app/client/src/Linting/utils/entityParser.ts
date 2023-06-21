import type { JSEntity, TEntity } from "Linting/lib/entity";
import { parseJSEntity } from "./parseJSEntity";

export type TEntityParser = {
  parse(entity: TEntity): unknown;
};

class DefaultEntityParser implements TEntityParser {
  parse(entity: TEntity): unknown {
    return entity.getRawEntity();
  }
}

class JSLintEntityParser implements TEntityParser {
  parse(entity: JSEntity) {
    return parseJSEntity(entity);
  }
}

export const defaultEntityParser = new DefaultEntityParser();
export const jsLintEntityParser = new JSLintEntityParser();
