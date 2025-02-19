package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.AppsmithRepository;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomWorkspaceRepositoryCE extends AppsmithRepository<Workspace> {

    Optional<Workspace> findByName(String name, AclPermission permission, User currentUser);

    List<Workspace> findByIdsIn(
            Set<String> workspaceIds, String organizationId, AclPermission permission, User currentUser, Sort sort);

    List<Workspace> findAll(AclPermission permission, User currentUser);
}
