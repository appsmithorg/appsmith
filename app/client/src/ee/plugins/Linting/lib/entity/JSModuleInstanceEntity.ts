import type {
  JSModuleInstanceEntity as TJSModuleInstanceEntity,
  JSModuleInstanceEntityConfig,
} from "@appsmith/entities/DataTree/types";
import { ModuleInstanceEntity } from "./ModuleInstanceEntity";
import {
  defaultDiffGenerator,
  type EntityDiffGenerator,
} from "plugins/Linting/utils/diffGenerator";
import type { IEntity } from "./types";
import type { Diff } from "deep-diff";
import { isJSFunctionProperty, type TParsedJSProperty } from "@shared/ast";
import type { EntityParser } from "plugins/Linting/utils/entityParser";

export class JSModuleInstanceEntity extends ModuleInstanceEntity {
  private entity: TJSModuleInstanceEntity;
  private config: JSModuleInstanceEntityConfig;
  entityParser: EntityParser;
  diffGenerator: EntityDiffGenerator = defaultDiffGenerator;

  constructor(
    entity: TJSModuleInstanceEntity,
    config: JSModuleInstanceEntityConfig,
    entityParser: EntityParser,
    diffGenerator: EntityDiffGenerator,
  ) {
    super(entity, config, diffGenerator);
    entityParser.parse(entity, config);
    this.entity = entity;
    this.config = config;
    this.entityParser = entityParser;
    this.diffGenerator = diffGenerator;
  }
  getRawEntity() {
    return this.entity;
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
