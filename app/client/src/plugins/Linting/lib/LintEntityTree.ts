import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import EntityFactory from "../../utils/entity";
import { LintEntityClassLoader } from "plugins/utils/entityClassLoader/LintEntityClassLoader";
import { EvalEntityClassLoader } from "plugins/utils/entityClassLoader/EvalEntityClassLoader";
import { EntityTree } from "../../utils/entityTree";

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
  constructor(unEvalTree: DataTree, configTree: ConfigTree) {
    super(unEvalTree, configTree);
    this.buildTree(unEvalTree, configTree);
  }
  buildTree(unEvalTree: DataTree, configTree: ConfigTree): void {
    const entities = Object.entries(unEvalTree);
    const entityClassLoader = new EvalEntityClassLoader();
    for (const [name, entity] of entities) {
      const config = configTree[name];
      this.tree.set(
        name,
        EntityFactory.getEntity(entity, config, entityClassLoader),
      );
    }
  }
}
