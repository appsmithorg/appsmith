import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import type { IEntity } from "../../Common/entity";
import EntityFactory from "../../Common/entity";
import { LintEntityClassLoader } from "plugins/Common/entityClassLoader/LintEntityClassLoader";
import { EvalEntityClassLoader } from "plugins/Common/entityClassLoader/EvalEntityClassLoader";
import { EntityTree } from "../../Common/entityTree";

export class LintEntityTree extends EntityTree {
  constructor(unEvalTree: DataTree, configTree: ConfigTree) {
    super(unEvalTree, configTree);
    this.buildTree(unEvalTree, configTree);
  }
  buildTree(unEvalTree: DataTree, configTree: ConfigTree): void {
    const entities = Object.entries(unEvalTree);
    const entityClassLoader = new LintEntityClassLoader();
    for (const [name, entity] of entities) {
      const config = configTree[name];
      this.tree.set(
        name,
        EntityFactory.getEntity(entity, config, entityClassLoader),
      );
    }
  }
}

export class EvaluationEntityTree extends EntityTree {
  #evaluatedTree: Record<string, unknown>;
  constructor(
    unEvalTree: DataTree,
    configTree: ConfigTree,
    cachedEntityTree: EvaluationEntityTree | null,
  ) {
    super(unEvalTree, configTree);
    this.buildTree(unEvalTree, configTree, cachedEntityTree);
    this.#evaluatedTree = cachedEntityTree?.getEvaluatedTree() || unEvalTree;
  }
  getEvaluatedTree(): Record<string, unknown> {
    return this.#evaluatedTree;
  }
  buildTree(
    unEvalTree: DataTree,
    configTree: ConfigTree,
    cachedEntityTree: EvaluationEntityTree | null,
  ): void {
    const entities = Object.entries(unEvalTree);
    const entityClassLoader = new EvalEntityClassLoader();
    for (const [name, rawEntity] of entities) {
      const cachedEntity = cachedEntityTree?.getEntityByName(name);
      const config = configTree[name];
      const isEqual = cachedEntity?.isEqual(rawEntity, config);
      const newEntity = isEqual
        ? (cachedEntity as IEntity)
        : EntityFactory.getEntity(rawEntity, config, entityClassLoader);
      this.tree.set(name, newEntity);
    }
  }
}
