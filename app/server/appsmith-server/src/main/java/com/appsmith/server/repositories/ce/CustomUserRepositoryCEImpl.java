package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
public class CustomUserRepositoryCEImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepositoryCE {

    @Override
    public Optional<User> findByEmail(String email, AclPermission permission, User currentUser) {
        BridgeQuery<User> emailCriteria = Bridge.equal(User.Fields.email, email);
        return queryBuilder()
                .criteria(emailCriteria)
                .permission(permission)
                .user(currentUser)
                .one();
    }
}
