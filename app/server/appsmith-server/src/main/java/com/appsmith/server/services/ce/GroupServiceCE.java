package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Group;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;

import java.util.Set;

public interface GroupServiceCE extends CrudService<Group, String> {

    Flux<Group> getAllById(Set<String> ids);

    Flux<Group> createDefaultGroupsForOrg(String organizationId);

    Flux<Group> getByOrganizationId(String organizationId);
}
