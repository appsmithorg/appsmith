export * from "../Objects/Registry";

import { ObjectsRegistry as CE_ObjectsRegistry } from "../Objects/Registry";
import { MultipleEnvironments } from "../Pages/MultipleEnvironments";
import { RBACHelper } from "../RBACHelper";
import { Provisioning } from "../Pages/ProvisioningHelper";
import { License } from "../Pages/LicenseHelper";
import { GitSync } from "../Pages/GitSync";
import GitExtended from "../Pages/GitExtended";

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

  private static provisioning__: Provisioning;
  static get Provisioning(): Provisioning {
    if (ObjectsRegistry.provisioning__ === undefined) {
      ObjectsRegistry.provisioning__ = new Provisioning();
    }
    return ObjectsRegistry.provisioning__;
  }

  private static license__: License;
  static get License(): License {
    if (ObjectsRegistry.license__ === undefined) {
      ObjectsRegistry.license__ = new License();
    }
    return ObjectsRegistry.license__;
  }

  private static gitExtended__: GitExtended;
  static get GitExtended(): GitExtended {
    if (ObjectsRegistry.gitExtended__ === undefined) {
      ObjectsRegistry.gitExtended__ = new GitExtended();
    }
    return ObjectsRegistry.gitExtended__;
  }
}
