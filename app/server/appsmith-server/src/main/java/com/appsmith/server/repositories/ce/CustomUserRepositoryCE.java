package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Optional;
import java.util.List;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    Optional<User> findByEmail(String email, AclPermission aclPermission);
}
