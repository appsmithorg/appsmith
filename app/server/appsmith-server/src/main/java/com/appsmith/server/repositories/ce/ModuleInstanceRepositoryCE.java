package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomModuleInstanceRepository;

public interface ModuleInstanceRepositoryCE
        extends BaseRepository<ModuleInstance, String>, CustomModuleInstanceRepository {}
