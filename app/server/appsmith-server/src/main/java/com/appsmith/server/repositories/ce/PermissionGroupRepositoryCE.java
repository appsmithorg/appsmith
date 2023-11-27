package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPermissionGroupRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface PermissionGroupRepositoryCE
        extends BaseRepository<PermissionGroup, String>, CustomPermissionGroupRepository {

    List<PermissionGroup> findAllById(Set<String> ids);

    Optional<PermissionGroup> findById(String id, AclPermission permission);

    List<PermissionGroup> findByAssignedToUserIdsIn(String userId);

    List<PermissionGroup> findByDefaultWorkspaceId(String defaultWorkspaceId);

    List<PermissionGroup> findByDefaultDomainIdAndDefaultDomainType(String defaultDomainId, String domainType);
}
