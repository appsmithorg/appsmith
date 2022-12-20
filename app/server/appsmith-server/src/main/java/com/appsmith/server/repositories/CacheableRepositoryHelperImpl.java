package com.appsmith.server.repositories;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.repositories.ce.CacheableRepositoryHelperCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;

@Component
public class CacheableRepositoryHelperImpl extends CacheableRepositoryHelperCEImpl implements CacheableRepositoryHelper{

    private final ReactiveMongoOperations mongoOperations;

    public CacheableRepositoryHelperImpl(ReactiveMongoOperations mongoOperations) {
        super(mongoOperations);
        this.mongoOperations = mongoOperations;
    }

    @Cache(cacheName = "permissionGroupsForUser", key = "{#user.email + #user.tenantId}")
    @Override
    public Mono<Set<String>> getPermissionGroupsOfUser(User user) {
        Criteria assignedToUserIdsCriteria = Criteria.where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)).is(user.getId());
        Criteria notDeletedCriteria = notDeleted();

        Criteria andCriteria = new Criteria();
        andCriteria.andOperator(assignedToUserIdsCriteria, notDeletedCriteria);

        Query query = new Query();
        query.addCriteria(andCriteria);

        Mono<Set<String>> userPermissionGroupIds = mongoOperations.find(query, PermissionGroup.class)
                .map(permissionGroup -> permissionGroup.getId())
                .collect(Collectors.toSet());

        Mono<Set<String>> userGroupPermissionIds = getPermissionGroupsOfGroupsForUser(user.getId());

        return Mono.zip(userPermissionGroupIds, userGroupPermissionIds)
                .map(tuple -> {
                    Set<String> userPermissionGroups = tuple.getT1();
                    Set<String> userGroupPermissionGroups = tuple.getT2();

                    Set<String> userAccessibleGroups = new HashSet<>();
                    userAccessibleGroups.addAll(userPermissionGroups);
                    userAccessibleGroups.addAll(userGroupPermissionGroups);

                    return userAccessibleGroups;
                });
    }

    private Mono<Set<String>> getPermissionGroupsOfGroupsForUser(String userId) {

        Criteria userCriteria = Criteria.where(fieldName(QUserGroup.userGroup.users)).is(userId);

        Query userGroupQuery = new Query();
        userGroupQuery.addCriteria(userCriteria);
        // Since we are only interested in id, don't fetch anything else
        userGroupQuery.fields().include(fieldName(QUserGroup.userGroup.id));

        return mongoOperations.find(userGroupQuery, UserGroup.class)
                .map(UserGroup::getId)
                .collectList()
                .flatMap(userGroups -> {
                    Criteria assignedToGroupIdsCriteria = Criteria.where(fieldName(QPermissionGroup.permissionGroup.assignedToGroupIds)).in(userGroups);
                    Criteria notDeletedCriteria = notDeleted();

                    Criteria andCriteria = new Criteria();
                    andCriteria.andOperator(assignedToGroupIdsCriteria, notDeletedCriteria);

                    Query permissionGroupQuery = new Query();
                    permissionGroupQuery.addCriteria(andCriteria);
                    // Since we are only interested in id, don't fetch anything else
                    permissionGroupQuery.fields().include(fieldName(QPermissionGroup.permissionGroup.id));

                    return mongoOperations.find(permissionGroupQuery, PermissionGroup.class)
                            .map(permissionGroup -> permissionGroup.getId())
                            .collect(Collectors.toSet());
                });

    }


}
