export * from "../Objects/Registry";

import { ObjectsRegistry as CE_ObjectsRegistry } from "../Objects/Registry";
import { MultipleEnvironments } from "../../e2e/EE/MultipleEnv/MultipleEnvironments";
import { RBACHelper } from "../RBACHelper";

export class ObjectsRegistry extends CE_ObjectsRegistry {
  private static multipleEnv__: MultipleEnvironments;
  static get MultipleEnvironments(): MultipleEnvironments {
    if (ObjectsRegistry.multipleEnv__ === undefined) {
      ObjectsRegistry.multipleEnv__ = new MultipleEnvironments();
    }
    return ObjectsRegistry.multipleEnv__;
  }

  private static rbacHelper__: RBACHelper;
  static get RBACHelper(): RBACHelper {
    if (ObjectsRegistry.rbacHelper__ === undefined) {
      ObjectsRegistry.rbacHelper__ = new RBACHelper();
    }
    return ObjectsRegistry.rbacHelper__;
  }
}
