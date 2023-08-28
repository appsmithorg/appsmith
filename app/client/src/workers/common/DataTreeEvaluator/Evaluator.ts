import type { EvaluationEntityTree } from "plugins/Linting/lib/LintEntityTree";
import { ScriptExecutor } from "./ExecutionContext";
import { PathUtils } from "plugins/Common/utils/pathUtils";
import { get, set } from "lodash";
import { EvaluationUtils } from "../../../plugins/Evaluation/utils/evaluationUtils";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { ValidatorFactory } from "plugins/Evaluation/validator";
import { SubstitutorFactory } from "plugins/Evaluation/substitution";
import { ReplacerFactory } from "plugins/Evaluation/replacer";

export class NodeEvaluator {
  scriptExecutor = new ScriptExecutor();
  evaluateTree(
    entityTree: EvaluationEntityTree,
    evaluationOrder: Array<string>,
    cachedEntityTree: EvaluationEntityTree | null,
  ) {
    const executionContext = this.scriptExecutor.getExecutionContext();
    const entities = entityTree.getEntities();
    for (const entity of entities) {
      const name = entity.getName();
      const rawEntity = entity.getRawEntity();
      executionContext.addValue(name, rawEntity);
    }
    executionContext.addValue("THIS_CONTEXT", {});
    const evaluatedTree = entityTree.getEvaluatedTree();
    for (const entityName of Object.keys(evaluatedTree)) {
      executionContext.addValue(entityName, evaluatedTree[entityName]);
    }
    for (const path of evaluationOrder) {
      const { entityName, propertyPath } =
        PathUtils.getEntityNameAndPropertyPath(path);
      const entity =
        entityTree.getEntityByName(entityName) ||
        cachedEntityTree?.getEntityByName(entityName);
      if (!entity) continue;
      const rawEntity = entity.getRawEntity();
      const rawPropertyValue = get(rawEntity, propertyPath, "");
      let evaluatedValue: unknown = rawPropertyValue;
      const requiresEval = EvaluationUtils.pathRequiresEvaluation(
        entity,
        propertyPath,
      );
      if (requiresEval) {
        const { jsSnippets, stringSegments } =
          getDynamicBindings(rawPropertyValue);
        const evaluatedParts = jsSnippets.map((jsSnippet: string, index) => {
          if (!jsSnippet) return stringSegments[index];
          const { errors, result } = this.scriptExecutor.execute(jsSnippet);
          return result;
        });
        const substitutionType = EvaluationUtils.getSubstitutionType(
          entity,
          propertyPath,
        );
        const substitutor = SubstitutorFactory.getSubstitutor(substitutionType);
        try {
          evaluatedValue = substitutor.substitute(
            rawPropertyValue,
            stringSegments,
            evaluatedParts,
          );
        } catch (error) {
          evaluatedValue = undefined;
        }
      }
      const validator = ValidatorFactory.getValidator(entity);
      evaluatedValue = validator.validate(evaluatedValue, entity, propertyPath);
      const replacer = ReplacerFactory.getReplacer(entity);
      evaluatedValue = replacer.replace(evaluatedValue, entity, propertyPath);
      set(evaluatedTree, path, evaluatedValue);
      executionContext.addValue(entityName, evaluatedTree[entityName]);
    }
  }
}
