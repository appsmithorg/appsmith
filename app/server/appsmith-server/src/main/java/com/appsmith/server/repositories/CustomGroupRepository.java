package com.appsmith.server.repositories;

import com.appsmith.server.domains.Group;
import reactor.core.publisher.Flux;

public interface CustomGroupRepository extends AppsmithRepository<Group> {
    Flux<Group> getAllByOrganizationId(String organizationId);
}
