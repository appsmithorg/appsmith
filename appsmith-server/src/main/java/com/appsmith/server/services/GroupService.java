package com.appsmith.server.services;

import com.appsmith.server.domains.Group;
import reactor.core.publisher.Flux;

import java.util.Set;

public interface GroupService extends CrudService<Group, String> {

    Flux<Group> getAllById(Set<String> ids);

    Flux<Group> createDefaultGroupsForOrg(String organizationId);

    Flux<Group> getByOrganizationId(String organizationId);
}
