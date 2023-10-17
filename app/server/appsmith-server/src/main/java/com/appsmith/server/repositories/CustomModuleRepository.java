package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Module;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomModuleRepository extends AppsmithRepository<Module> {
    Flux<Module> getAllModulesByPackageId(String packageId, AclPermission permission);

    Mono<UpdateResult> update(String id, Update updateObj, AclPermission permission);
}
