package com.appsmith.server.repositories;

import com.appsmith.server.domains.Module;
import org.springframework.stereotype.Repository;

@Repository
public interface ModuleRepository extends BaseRepository<Module, String>, CustomModuleRepository {}
