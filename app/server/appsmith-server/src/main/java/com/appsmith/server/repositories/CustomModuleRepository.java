package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Module;
import reactor.core.publisher.Flux;

public interface CustomModuleRepository extends AppsmithRepository<Module> {
    Flux<Module> getAllModulesByPackageId(String packageId, AclPermission permission);
}
