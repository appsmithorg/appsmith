import { EvaluationSubstitutionType } from "entities/DataTree/types";
import type { IEntity } from "plugins/Common/entity";
import { EntityUtils } from "plugins/Common/utils/entityUtils";
import { PathUtils } from "plugins/Common/utils/pathUtils";

export class EvaluationUtils {
  static pathRequiresEvaluation(entity: IEntity, path: string) {
    if (!EntityUtils.isDynamicEntity(entity)) return false;
    if (EntityUtils.isJSAction(entity)) return path !== "body";
    const isADynamicBindingPath = PathUtils.isPathADynamicBinding(entity, path);
    const isADynamicTriggerPath = PathUtils.isPathADynamicTrigger(entity, path);
    return isADynamicBindingPath || isADynamicTriggerPath;
  }
  static getSubstitutionType(entity: IEntity, path: string) {
    if (!EntityUtils.isDynamicEntity(entity))
      return EvaluationSubstitutionType.TEMPLATE;
    const config = entity.getConfig();
    const reactivePaths = config.reactivePaths || [];
    return reactivePaths[path] || EvaluationSubstitutionType.TEMPLATE;
  }
}
