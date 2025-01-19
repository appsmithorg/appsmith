package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Optional;
import java.util.Set;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    Optional<User> findByEmail(String email, AclPermission permission, User currentUser);

    Optional<Boolean> isUsersEmpty();

    Set<String> getSystemGeneratedUserEmails();

    Optional<Integer> updateById(String id, BridgeUpdate updateObj);
}
