package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPermissionGroupRepository;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Set;

public interface PermissionGroupRepositoryCE
        extends BaseRepository<PermissionGroup, String>, CustomPermissionGroupRepository {

    List<PermissionGroup> findAllByIdIn(Set<String> ids, EntityManager entityManager);

    List<PermissionGroup> findByDefaultWorkspaceId(String defaultWorkspaceId, EntityManager entityManager);

    List<PermissionGroup> findByDefaultDomainIdAndDefaultDomainType(
            String defaultDomainId, String domainType, EntityManager entityManager);
}
