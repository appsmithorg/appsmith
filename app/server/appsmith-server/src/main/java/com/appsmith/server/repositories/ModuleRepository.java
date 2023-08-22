package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.ModuleRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface ModuleRepository extends ModuleRepositoryCE, CustomModuleRepository {}
