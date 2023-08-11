import type { TParsedJSProperty } from "@shared/ast";
import { diff } from "deep-diff";
import type { JSEntity } from "plugins/Common/entity/JSEntity";
import type { EntityDiffGenerator } from ".";

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
      const jsParser = entity.entityParser;
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
