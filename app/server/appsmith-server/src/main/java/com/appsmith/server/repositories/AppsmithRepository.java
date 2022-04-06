package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface AppsmithRepository<T> {

    Mono<T> findById(String id, AclPermission permission);

    Mono<T> updateById(String id, T resource, AclPermission permission);

    Flux<T> queryAll(List<Criteria> criterias, AclPermission permission);

    Flux<T> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort);

    Flux<T> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort);

    T setUserPermissionsInObject(T obj, User user);

    Mono<T> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, AclPermission permission);
}
