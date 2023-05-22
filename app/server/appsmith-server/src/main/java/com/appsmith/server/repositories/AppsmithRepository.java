/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface AppsmithRepository<T> {

  Mono<T> findById(String id, AclPermission permission);

  Mono<T> findById(String id, Optional<AclPermission> permission);

  Mono<T> findById(String id, List<String> projectionFieldNames, AclPermission permission);

  Mono<T> updateById(String id, T resource, AclPermission permission);

  Flux<T> queryAll(List<Criteria> criterias, AclPermission permission);

  Flux<T> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort);

  Flux<T> queryAll(
      List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort);

  Mono<T> setUserPermissionsInObject(T obj, Set<String> permissionGroups);

  Mono<T> setUserPermissionsInObject(T obj);

  Mono<Boolean> isPermissionPresentForUser(
      Set<Policy> policies, String permission, String username);
}
