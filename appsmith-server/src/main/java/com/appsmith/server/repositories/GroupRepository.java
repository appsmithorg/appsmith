package com.appsmith.server.repositories;

import com.appsmith.server.domains.Group;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface GroupRepository extends BaseRepository<Group, String> {

    Flux<Group> getAllByOrganizationId(String organizationId);
}
