package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Optional;

public interface CustomConfigRepositoryCE extends AppsmithRepository<Config> {
    Optional<Config> findByName(String name, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<Config> findByNameAsUser(String name, User user, AclPermission permission, User currentUser, EntityManager entityManager);
}
