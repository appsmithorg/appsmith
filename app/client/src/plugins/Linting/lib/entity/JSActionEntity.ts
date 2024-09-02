import type {
  JSActionEntity as TJSActionEntity,
  JSActionEntityConfig as TJSActionEntityConfig,
} from "ee/entities/DataTree/types";
import {
  defaultDiffGenerator,
  type EntityDiffGenerator,
} from "plugins/Linting/utils/diffGenerator";
import type { EntityParser } from "plugins/Linting/utils/entityParser";
import type { TParsedJSProperty } from "@shared/ast";
import { isJSFunctionProperty } from "@shared/ast";
import { ENTITY_TYPE, type IEntity } from "ee/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";

export class JSEntity implements IEntity {
  entity: TJSActionEntity;
  private config: TJSActionEntityConfig;
  entityParser: EntityParser;
  diffGenerator: EntityDiffGenerator = defaultDiffGenerator;

  constructor(
    entity: TJSActionEntity,
    config: TJSActionEntityConfig,
    entityParser: EntityParser,
    diffGenerator: EntityDiffGenerator,
  ) {
    entityParser.parse(entity, config);
    this.entity = entity;
    this.config = config;
    this.entityParser = entityParser;
    this.diffGenerator = diffGenerator;
  }
  getType() {
    return ENTITY_TYPE.JSACTION;
  }
  getRawEntity() {
    return this.entity;
  }
  getConfig() {
    return this.config;
  }
  getName() {
    return this.config.name;
  }
  getId() {
    return this.config.actionId;
  }
  isEqual(body: string) {
    return body === this.getRawEntity().body;
  }
  computeDifference(oldEntity?: IEntity): Diff<unknown>[] | undefined {
    return this.diffGenerator.generate(oldEntity, this);
  }
  getFns() {
    const jsFunctions = [];
    const { parsedEntity, parsedEntityConfig } = this.entityParser.parse(
      this.entity,
      this.config,
    );
    for (const propertyName of Object.keys(parsedEntityConfig)) {
      const jsPropertyConfig = parsedEntityConfig[
        propertyName
      ] as TParsedJSProperty;
      const jsPropertyFullName = `${this.getName()}.${propertyName}`;
      if (!isJSFunctionProperty(jsPropertyConfig)) continue;
      jsFunctions.push({
        name: jsPropertyFullName,
        body: parsedEntity[propertyName],
        isMarkedAsync: jsPropertyConfig.isMarkedAsync,
      });
    }
    return jsFunctions;
  }
}
