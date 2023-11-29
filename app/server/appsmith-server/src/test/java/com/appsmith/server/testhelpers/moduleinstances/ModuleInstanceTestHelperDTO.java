package com.appsmith.server.testhelpers.moduleinstances;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ModuleDTO;
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
    PageDTO pageDTO;
    ModuleDTO sourceModuleDTO;
    Optional<ModuleDTO> consumableModuleOptional;
    NewAction modulePublicAction;
    String moduleInstanceName;
}
