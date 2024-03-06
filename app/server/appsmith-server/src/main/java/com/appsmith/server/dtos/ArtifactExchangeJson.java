package com.appsmith.server.dtos;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ce.ArtifactExchangeJsonCE;

import java.util.List;

public interface ArtifactExchangeJson extends ArtifactExchangeJsonCE {

    List<ExportableModule> getSourceModuleList();

    void setSourceModuleList(List<ExportableModule> sourceModules);

    List<ModuleInstance> getModuleInstanceList();

    void setModuleInstanceList(List<ModuleInstance> newActions);
}
