package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.domains.Environment;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomEnvironmentRepositoryCE extends AppsmithRepository<Environment> {

    Flux<Environment> findByWorkspaceId(String workSpaceId, AclPermission aclPermission);

    Mono<Environment> findById(String id, AclPermission aclPermission);
}
