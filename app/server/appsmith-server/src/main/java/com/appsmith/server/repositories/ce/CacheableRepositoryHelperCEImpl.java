package com.appsmith.server.repositories.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;

@RequiredArgsConstructor
public class CacheableRepositoryHelperCEImpl implements CacheableRepositoryHelperCE {
    private final ReactiveMongoOperations mongoOperations;

    /**
     * 1. Get all the user groups associated with the user
     * 2. Get all the permission groups associated with anonymous user
     * 3. Return the set of all the permission groups.
     * @param user
     * @return
     */
    @Cache(cacheName = "permissionGroupsForUser")
    @Override
    public Mono<Set<String>> getAllPermissionGroupsForUser(User user) {
        return Mono.zip(getPermissionGroupsOfUser(user), getAnonymousUserPermissionGroups())
                .map(tuple -> {
                    Set<String> currentUserPermissionGroups = tuple.getT1();
                    Set<String> anonymousUserPermissionGroups = tuple.getT2();

                    currentUserPermissionGroups.addAll(anonymousUserPermissionGroups);

                    return currentUserPermissionGroups;
                });
    }

    protected Mono<Set<String>> getPermissionGroupsOfUser(User user) {
        Criteria assignedToUserIdsCriteria = Criteria.where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).is(user.getId());

        Query query = new Query();
        query.addCriteria(assignedToUserIdsCriteria);

        return mongoOperations.find(query, PermissionGroup.class)
                .map(permissionGroup -> permissionGroup.getId())
                .collect(Collectors.toSet());
    }

    protected Mono<Set<String>> getAnonymousUserPermissionGroups() {
        Criteria anonymousUserCriteria = Criteria.where(fieldName(QUser.user.email)).is(FieldName.ANONYMOUS_USER);

        Query query = new Query();
        query.addCriteria(anonymousUserCriteria);

        return mongoOperations.findOne(query, User.class)
                .flatMap(anonymousUser -> getPermissionGroupsOfUser(anonymousUser));
    }
}
