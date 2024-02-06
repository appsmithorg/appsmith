package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CustomWorkspaceRepositoryCE extends AppsmithRepository<Workspace> {

    Mono<Workspace> findByName(String name, AclPermission aclPermission);

    List<Workspace> findByIdsIn(Set<String> workspaceIds, String tenantId, AclPermission aclPermission, Sort sort);

    List<Workspace> findAllWorkspaces();

    List<Workspace> findAll(AclPermission permission);
}
