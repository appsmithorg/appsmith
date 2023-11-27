package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface AppsmithRepository<T> {

    Optional<T> findById(String id, AclPermission permission);

    // Optional<T> findById(String id, List<String> projectionFieldNames, AclPermission permission);

    // T updateById(Long id, T resource, AclPermission permission);

    List<T> queryAll(List<Criteria> criterias, AclPermission permission);

    List<T> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort);

    List<T> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort);

    T setUserPermissionsInObject(T obj, Set<String> permissionGroups);

    T setUserPermissionsInObject(T obj);

    T updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission);
}
