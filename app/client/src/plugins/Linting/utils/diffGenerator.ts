import type { TParsedJSProperty } from "@shared/ast";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import type { jsLintEntityParser } from "./entityParser";
import type { IEntity } from "ee/plugins/Linting/lib/entity/types";
import type { JSEntity } from "plugins/Linting/lib/entity/JSActionEntity";

export interface EntityDiffGenerator {
  generate(
    baseEntity?: IEntity,
    compareEntity?: IEntity,
  ): Diff<unknown>[] | undefined;
}

export class DefaultDiffGenerator implements EntityDiffGenerator {
  generate(baseEntity?: IEntity, compareEntity?: IEntity) {
    return diff(
      this.generateDiffObj(baseEntity),
      this.generateDiffObj(compareEntity),
    );
  }
  generateDiffObj(entity?: IEntity) {
    if (!entity) {
      return {};
    }

    return { [entity.getName()]: entity.getRawEntity() };
  }
}

export class JSLintDiffGenerator implements EntityDiffGenerator {
  generate(baseEntity?: JSEntity, compareEntity?: JSEntity) {
    return diff(
      this.generateDiffObj(baseEntity),
      this.generateDiffObj(compareEntity),
    );
  }
  generateDiffObj(entity?: JSEntity) {
    if (!entity) {
      return {};
    }

    const entityForDiff: Record<string, string> = {};

    for (const [propertyName, propertyValue] of Object.entries(
      entity.getRawEntity(),
    )) {
      const jsParser = entity.entityParser as typeof jsLintEntityParser;
      const { parsedEntityConfig } = jsParser.parse(
        entity.getRawEntity(),
        entity.getConfig(),
      );

      if (!parsedEntityConfig) continue;

      entityForDiff[propertyName] = this.getHashedConfigString(
        propertyValue,
        parsedEntityConfig[propertyName] as TParsedJSProperty,
      );
    }

    return { [entity.getName()]: entityForDiff };
  }

  getHashedConfigString(propertyValue: string, config: TParsedJSProperty) {
    if (!config || !config.position || !config.value) return propertyValue;

    const { endColumn, endLine, startColumn, startLine } = config.position;

    return config.value + `${startColumn}${endColumn}${startLine}${endLine}`;
  }
}

export const jsLintDiffGenerator = new JSLintDiffGenerator();
export const defaultDiffGenerator = new DefaultDiffGenerator();
