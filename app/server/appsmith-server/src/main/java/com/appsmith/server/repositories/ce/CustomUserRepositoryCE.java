package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;

public interface CustomUserRepositoryCE extends AppsmithRepository<User> {

    List<User> findByEmail(String email, AclPermission aclPermission);

    List<User> findByCaseInsensitiveEmail(String email);

    List<User> findByEmailAndTenantId(String email, String tenantId);

    List<Boolean> isUsersEmpty();
}
