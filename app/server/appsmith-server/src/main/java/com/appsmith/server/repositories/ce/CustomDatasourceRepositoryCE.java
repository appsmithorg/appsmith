package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomDatasourceRepositoryCE extends AppsmithRepository<Datasource> {

    List<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission);

    Optional<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission);

    Optional<Datasource> findById(String id, AclPermission aclPermission);

    List<Datasource> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields);
}
