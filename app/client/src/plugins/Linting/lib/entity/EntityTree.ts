import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import type { IEntity } from ".";
import type { Diff } from "deep-diff";
import EntityFactory from ".";
import { PathUtils } from "plugins/Linting/utils/pathUtils";
import { isJSAction } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { EntityParser } from "plugins/Linting/utils/entityParser";
import { jsLintEntityParser } from "plugins/Linting/utils/entityParser";
import type { EntityDiffGenerator } from "plugins/Linting/utils/diffGenerator";
import { jsLintDiffGenerator } from "plugins/Linting/utils/diffGenerator";

export abstract class EntityTree {
  protected tree = new Map<string, IEntity>();
  protected unEvalTree: DataTree = {};
  protected configTree: ConfigTree = {};
  constructor(unEvalTree: DataTree, configTree: ConfigTree) {
    this.unEvalTree = unEvalTree;
    this.configTree = configTree;
  }
  abstract buildTree(unEvalTree: DataTree, configTree: ConfigTree): void;
  computeDifferences(tree?: EntityTree) {
    const differences: Diff<unknown>[] = [];
    if (!tree) return differences;
    for (const [name, entity] of this.tree.entries()) {
      const otherEntity = tree.getEntityByName(name);
      if (!otherEntity) continue; // TODO: Add new or Delete event
      const difference = entity.computeDifference(otherEntity);
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
    parser?: EntityParser;
    diffGenerator?: EntityDiffGenerator;
  };
}

class LintEntityClassLoader implements EntityClassLoader {
  load(entity: DataTreeEntity) {
    if (isJSAction(entity)) {
      return {
        parser: jsLintEntityParser,
        diffGenerator: jsLintDiffGenerator,
      };
    }
    return {
      parser: undefined,
      diffGenerator: undefined,
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
      if (!config) continue;
      this.tree.set(name, EntityFactory.getEntity(entity, config, classLoader));
    }
  }
}
