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
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.Modifying;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Slf4j
public class CustomUserRepositoryCEImpl extends BaseAppsmithRepositoryImpl<User> implements CustomUserRepositoryCE {

    @Override
    public Optional<User> findByEmail(
            String email, AclPermission permission, User currentUser, EntityManager entityManager) {
        BridgeQuery<User> emailCriteria = Bridge.equal(User.Fields.email, email);
        return queryBuilder()
                .criteria(emailCriteria)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .one();
    }

    /**
     * Fetch minimal information from *a* user document in the database, limit to two documents, filter anonymousUser
     * If no documents left return true otherwise return false.
     *
     * @return Boolean, indicated where there exists at least one user in the system or not.
     */
    @Override
    public Optional<Boolean> isUsersEmpty(EntityManager entityManager) {
        return Optional.of(queryBuilder()
                .criteria(Bridge.notIn(User.Fields.email, getSystemGeneratedUserEmails()))
                .limit(1)
                .entityManager(entityManager)
                .all(IdOnly.class)
                .isEmpty());
    }

    protected Set<String> getSystemGeneratedUserEmails() {
        Set<String> systemGeneratedEmails = new HashSet<>();
        systemGeneratedEmails.add(FieldName.ANONYMOUS_USER);
        return systemGeneratedEmails;
    }

    @Override
    @Modifying
    @Transactional
    public Optional<Integer> updateById(String id, BridgeUpdate updateObj, EntityManager entityManager) {
        if (id == null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID);
        }
        return Optional.of(queryBuilder().byId(id).entityManager(entityManager).updateFirst(updateObj));
    }
}
