package com.appsmith.server.dtos;

import com.appsmith.server.domains.Module;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExportableModule {

    String packageUUID;
    String moduleUUID;

    public ExportableModule(Module module) {
        this.packageUUID = module.getPackageUUID();
        this.moduleUUID = module.getModuleUUID();
    }
}
