package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface AppsmithRepository<T> {

    Mono<T> findById(String id, AclPermission permission);

    Mono<T> findById(String id, Optional<AclPermission> permission);

    Mono<T> findById(String id, List<String> projectionFieldNames, AclPermission permission);

    Mono<T> updateById(String id, T resource, AclPermission permission);

    Flux<T> queryAll(List<Criteria> criterias, AclPermission permission);

    Flux<T> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort);

    Flux<T> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort);

    Mono<T> setUserPermissionsInObject(T obj, Set<String> permissionGroups);

    Mono<T> setUserPermissionsInObject(T obj);

    Mono<T> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission);
}
