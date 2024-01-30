package com.appsmith.server.testhelpers.moduleinstances;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PageDTO;
import lombok.Data;

import java.util.Optional;

@Data
public class ModuleInstanceTestHelperDTO {
    String workspaceId;
    String workspaceName;
    String applicationName;
    String defaultEnvironmentId;
    Datasource datasource;
    Datasource jsDatasource;
    PageDTO pageDTO;
    PackageDTO originPackageDTO;
    ModuleDTO originModuleDTO;
    ModuleDTO originJSModuleDTO;
    Optional<ModuleDTO> consumableModuleOptional;
    Optional<ModuleDTO> consumableJSModuleOptional;
    NewAction modulePublicAction;
    ActionCollection modulePublicActionCollection;
    String moduleInstanceName;
}
