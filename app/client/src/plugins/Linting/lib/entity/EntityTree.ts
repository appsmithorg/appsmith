import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeTypes";
import type { IEntity } from "ee/plugins/Linting/lib/entity/types";
import type { Diff } from "deep-diff";
import EntityFactory from "ee/plugins/Linting/lib/entity";
import { PathUtils } from "plugins/Linting/utils/pathUtils";
import { isJSAction } from "ee/workers/Evaluation/evaluationUtils";
import type { EntityParser } from "plugins/Linting/utils/entityParser";
import {
  DefaultEntityParser,
  JSLintEntityParser,
} from "plugins/Linting/utils/entityParser";
import type { EntityDiffGenerator } from "plugins/Linting/utils/diffGenerator";
import {
  DefaultDiffGenerator,
  JSLintDiffGenerator,
} from "plugins/Linting/utils/diffGenerator";
import { union } from "lodash";

export abstract class EntityTree {
  protected tree = new Map<string, IEntity>();
  protected unEvalTree: DataTree = {};
  protected configTree: ConfigTree = {};
  constructor(unEvalTree: DataTree, configTree: ConfigTree) {
    this.unEvalTree = unEvalTree;
    this.configTree = configTree;
  }
  abstract buildTree(unEvalTree: DataTree, configTree: ConfigTree): void;
  computeDifferences(newTree: EntityTree) {
    const differences: Diff<unknown>[] = [];
    if (!newTree) return differences;
    const entityNames = Object.keys(this.getRawTree());
    const newEntityNames = Object.keys(newTree.getRawTree());
    const allEntityNames = union(entityNames, newEntityNames);
    for (const entityName of allEntityNames) {
      const entity = this.getEntityByName(entityName);
      const newEntity = newTree.getEntityByName(entityName);

      if (!newEntity) {
        differences.push({
          path: [entityName],
          kind: "D",
          lhs: entity?.getRawEntity(),
        });
        continue;
      }
      const difference = newEntity.computeDifference(entity);
      if (!difference) continue;
      differences.push(...difference);
    }
    return differences;
  }

  getAllPaths = (): Record<string, true> => {
    return PathUtils.getAllPaths(this.unEvalTree);
  };

  getRawTree() {
    const rawTree: DataTree = {};
    for (const [name, entity] of this.tree.entries()) {
      rawTree[name] = entity.getRawEntity() as DataTreeEntity;
    }
    return rawTree as DataTree;
  }

  getEntityByName(name: string) {
    return this.tree.get(name);
  }

  getEntities() {
    const entities = Array.from(this.tree.values());
    return entities;
  }
}

export interface EntityClassLoader {
  load(entity: DataTreeEntity): {
    Parser: { new (): EntityParser };
    DiffGenerator: { new (): EntityDiffGenerator };
  };
}

class LintEntityClassLoader implements EntityClassLoader {
  load(entity: DataTreeEntity) {
    if (isJSAction(entity)) {
      return {
        Parser: JSLintEntityParser,
        DiffGenerator: JSLintDiffGenerator,
      };
    }
    return {
      Parser: DefaultEntityParser,
      DiffGenerator: DefaultDiffGenerator,
    };
  }
}

export class LintEntityTree extends EntityTree {
  constructor(unEvalTree: DataTree, configTree: ConfigTree) {
    super(unEvalTree, configTree);
    this.buildTree(unEvalTree, configTree);
  }
  buildTree(unEvalTree: DataTree, configTree: ConfigTree): void {
    const entities = Object.entries(unEvalTree);
    const classLoader = new LintEntityClassLoader();
    for (const [name, entity] of entities) {
      const config = configTree[name];
      this.tree.set(name, EntityFactory.getEntity(entity, config, classLoader));
    }
  }
}
