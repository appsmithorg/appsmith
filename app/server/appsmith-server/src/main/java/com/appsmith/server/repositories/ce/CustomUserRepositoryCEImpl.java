package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.projections.IdOnly;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Slf4j
public class CustomUserRepositoryCEImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepositoryCE {

    @Override
    public Optional<User> findByEmail(String email, AclPermission permission, User currentUser) {
        BridgeQuery<User> emailCriteria = Bridge.equal(User.Fields.email, email);
        return queryBuilder()
                .criteria(emailCriteria)
                .permission(permission, currentUser)
                .one();
    }

    /**
     * Fetch minimal information from *a* user document in the database, limit to two documents, filter anonymousUser
     * If no documents left return true otherwise return false.
     *
     * @return Boolean, indicated where there exists at least one user in the system or not.
     */
    @Override
    public Optional<Boolean> isUsersEmpty() {
        return Optional.of(queryBuilder()
                .criteria(Bridge.notIn(User.Fields.email, getSystemGeneratedUserEmails()))
                .limit(1)
                .all(IdOnly.class)
                .isEmpty());
    }

    protected Set<String> getSystemGeneratedUserEmails() {
        Set<String> systemGeneratedEmails = new HashSet<>();
        systemGeneratedEmails.add(FieldName.ANONYMOUS_USER);
        return systemGeneratedEmails;
    }

    @Override
    public Optional<Integer> updateById(String id, BridgeUpdate updateObj) {
        if (id == null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID);
        }
        return Optional.of(queryBuilder().byId(id).updateFirst(updateObj));
    }
}
