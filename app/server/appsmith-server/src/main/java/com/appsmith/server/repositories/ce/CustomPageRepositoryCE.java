package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Page;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;

import java.util.Optional;

public interface CustomPageRepositoryCE extends AppsmithRepository<Page> {
    Optional<Page> findByIdAndLayoutsId(String id, String layoutId, AclPermission aclPermission);

    Optional<Page> findByName(String name, AclPermission aclPermission);

    Flux<Page> findByApplicationId(String applicationId, AclPermission aclPermission);

    Optional<Page> findByNameAndApplicationId(String name, String applicationId, AclPermission aclPermission);
}
