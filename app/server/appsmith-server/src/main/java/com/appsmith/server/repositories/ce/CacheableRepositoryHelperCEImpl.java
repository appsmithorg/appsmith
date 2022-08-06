package com.appsmith.server.repositories.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
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

    @Cache(cacheName = "permissionGroupsForUser", key="{#user.email + #user.tenantId}")
    @Override
    public Mono<Set<String>> getPermissionGroupsOfUser(User user) {
        Criteria assignedToUserIdsCriteria = Criteria.where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).is(user.getId());

        Query query = new Query();
        query.addCriteria(assignedToUserIdsCriteria);

        return mongoOperations.find(query, PermissionGroup.class)
                .map(permissionGroup -> permissionGroup.getId())
                .collect(Collectors.toSet());
    }

    @Override
    public Mono<Set<String>> getAnonymousUserPermissionGroups() {
        Criteria anonymousUserCriteria = Criteria.where(fieldName(QUser.user.email)).is(FieldName.ANONYMOUS_USER);

        Query query = new Query();
        query.addCriteria(anonymousUserCriteria);

        return mongoOperations.findOne(query, User.class)
                .flatMap(anonymousUser -> this.getPermissionGroupsOfUser(anonymousUser));
    }

    @CacheEvict(cacheName = "permissionGroupsForUser", key="{#email + #tenantId}")
    @Override
    public Mono<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return Mono.empty();
    }
}
