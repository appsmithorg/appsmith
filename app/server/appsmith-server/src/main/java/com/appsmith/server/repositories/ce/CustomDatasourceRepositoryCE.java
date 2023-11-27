package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomDatasourceRepositoryCE extends AppsmithRepository<Datasource> {

    List<Datasource> findAllByWorkspaceId(Long workspaceId);

    // List<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission);

    // List<Datasource> findAllByWorkspaceId(String workspaceId, Optional<AclPermission> permission);

    Datasource findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission);

    Datasource findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> permission);

    List<Datasource> findAllByIds(Set<String> ids, AclPermission permission);

    List<Datasource> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields);
}
