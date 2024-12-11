package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.AppsmithRepository;
import jakarta.persistence.EntityManager;

import java.util.Optional;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    Optional<User> findByEmail(String email, AclPermission permission, User currentUser, EntityManager entityManager);

    Optional<Boolean> isUsersEmpty(EntityManager entityManager);

    Optional<Integer> updateById(String id, BridgeUpdate updateObj);
}
