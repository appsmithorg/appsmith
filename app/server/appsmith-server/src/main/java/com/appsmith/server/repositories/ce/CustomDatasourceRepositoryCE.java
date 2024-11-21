package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;

public interface CustomDatasourceRepositoryCE extends AppsmithRepository<Datasource> {

    List<Datasource> findAllByWorkspaceId(
            String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<Datasource> findByNameAndWorkspaceId(
            String name, String workspaceId, AclPermission permission, User currentUser, EntityManager entityManager);
}
