package com.appsmith.server.dtos;

import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.Package;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExportableModule {

    String packageUUID;
    String packageName;
    String moduleUUID;
    String moduleName;
    String version;

    public ExportableModule(Package aPackage, Module module) {
        this.packageUUID = aPackage.getPackageUUID();
        this.packageName = aPackage.getPublishedPackage().getName();
        this.moduleUUID = module.getModuleUUID();
        this.moduleName = module.getPublishedModule().getName();
        this.version = aPackage.getVersion();
    }
}
