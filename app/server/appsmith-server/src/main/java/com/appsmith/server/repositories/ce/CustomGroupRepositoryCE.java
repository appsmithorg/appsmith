package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Group;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;

public interface CustomGroupRepositoryCE extends AppsmithRepository<Group> {
    Flux<Group> getAllByOrganizationId(String organizationId);
}
