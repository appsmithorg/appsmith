import type { EvaluationEntityTree } from "plugins/Linting/lib/LintEntityTree";
import { ExecutionContext, ScriptExecutor } from "./ExecutionContext";
import { PathUtils } from "plugins/Linting/utils/pathUtils";

export class Evaluator {
  scriptExecutor = new ScriptExecutor();
  evaluateTree(
    entityTree: EvaluationEntityTree,
    evaluationOrder: Array<string>,
    evaluatedTree: Record<string, unknown> = {},
  ) {
    const executionContext = this.scriptExecutor.getExecutionContext();
    const entities = entityTree.getEntities();
    for (const entity of entities) {
      const name = entity.getName();
      const rawEntity = entity.getRawEntity();
      executionContext.addEntity(name, rawEntity);
    }

    for (const entityName of Object.keys(evaluatedTree)) {
      executionContext.addEntity(entityName, evaluatedTree[entityName]);
    }

    for (const path of evaluationOrder) {
      const { entityName, propertyPath } =
        PathUtils.getEntityNameAndPropertyPath(path);
      const entity = entityTree.getEntityByName(entityName);
      const propertyValue = entity.getPropertyValue(propertyPath);
      const { errors, result } = this.scriptExecutor.execute(propertyValue);
    }
  }
}
