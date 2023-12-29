package com.appsmith.server.moduleinstances.crud;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewPage;

public interface CrudModuleInstanceService extends CrudModuleInstanceServiceCECompatible {
    void generateAndSetModuleInstancePolicies(NewPage page, ModuleInstance moduleInstance);
}
