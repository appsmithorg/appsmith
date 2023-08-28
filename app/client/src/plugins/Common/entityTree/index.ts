import type {
  ConfigTree,
  DataTree,
  DataTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import type { IEntity } from "plugins/Common/entity";
import type { Diff } from "deep-diff";
import { PathUtils } from "plugins/Common/utils/pathUtils";
import { union } from "lodash";

export abstract class EntityTree {
  protected tree = new Map<string, IEntity>();
  protected unEvalTree: DataTree = {};
  protected configTree: ConfigTree = {};
  constructor(unEvalTree: DataTree, configTree: ConfigTree) {
    this.unEvalTree = unEvalTree;
    this.configTree = configTree;
  }
  abstract buildTree(
    unEvalTree: DataTree,
    configTree: ConfigTree,
    cachedTree: EntityTree | null,
  ): void;
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
