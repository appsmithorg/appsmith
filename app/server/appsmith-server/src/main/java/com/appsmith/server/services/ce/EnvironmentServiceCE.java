package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;



public interface EnvironmentServiceCE extends CrudService<Environment, String> {

    //Read
    Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission);

    Mono<Environment> findById(String id, AclPermission aclPermission);

    //update --no update calls on CEServices

    //Create
//    Flux<Environment> saveAll(List<Environment> environmentList, AclPermission aclPermission);

    //Delete
}
