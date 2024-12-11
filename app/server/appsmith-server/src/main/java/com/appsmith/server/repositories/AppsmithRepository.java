package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.ce.params.QueryAllParams;
import jakarta.persistence.EntityManager;

import java.util.Collection;
import java.util.Optional;

public interface AppsmithRepository<T extends BaseDomain> {

    Optional<T> findById(String id, AclPermission permission, User currentUser, EntityManager entityManager);

    /**
     * This method is used to find a domain by its ID without checking for permissions. This method should be used
     * when the caller is sure that the permissions have already been checked.
     * @param id ID of the domain to be found
     * @return Domain with the given ID if it exists, empty otherwise
     */
    Optional<T> getById(String id, EntityManager entityManager);

    Optional<T> updateById(
            String id, T resource, AclPermission permission, User currentUser, EntityManager entityManager);

    int updateByIdWithoutPermissionCheck(String id, BridgeUpdate update, EntityManager entityManager);

    /*no-cake*/ QueryAllParams<T> queryBuilder();

    T setUserPermissionsInObject(T obj, Collection<String> permissionGroups);

    T setUserPermissionsInObject(T obj, User user, EntityManager entityManager);

    T updateAndReturn(
            String id, BridgeUpdate updateObj, AclPermission permission, User currentUser, EntityManager entityManager);
}
