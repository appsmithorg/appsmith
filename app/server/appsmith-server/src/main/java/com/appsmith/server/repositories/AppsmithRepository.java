package com.appsmith.server.repositories;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import org.springframework.data.domain.Sort;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface AppsmithRepository<T> {

    Mono<T> findById(String id, AclPermission permission);

    Mono<T> findById(String id, List<String> projectionFieldNames, AclPermission permission);

    Mono<T> updateById(String id, T resource, AclPermission permission);

    Flux<T> queryAll(List<Criteria> criterias, AclPermission permission);

    Flux<T> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort);

    Flux<T> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort);

    /**
     * DO NOT USE THIS FUNCTION UNLESS YOU KNOW WHAT YOU ARE DOING
     * This is an unsafe function that fetches data without persmissions. This should only be used very sparingly
     * @param criterias
     * @param includeFields
     * @param sort
     * @param limit
     * @return
     */
    Flux<T> queryAllWithoutPermissions(List<Criteria> criterias, List<String> includeFields, Sort sort, int limit);

    Mono<T> setUserPermissionsInObject(T obj, Set<String> permissionGroups);

    Mono<T> setUserPermissionsInObject(T obj);

    Mono<T> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, AclPermission permission);

    Mono<Boolean> isPermissionPresentForUser(Set<Policy> policies, String permission, String username);
}
