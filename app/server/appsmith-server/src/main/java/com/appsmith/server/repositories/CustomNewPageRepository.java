package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewPage;
import reactor.core.publisher.Flux;

public interface CustomNewPageRepository extends AppsmithRepository<NewPage> {
    Flux<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission);
}
