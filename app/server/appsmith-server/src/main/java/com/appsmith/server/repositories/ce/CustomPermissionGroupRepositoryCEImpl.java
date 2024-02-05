package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.result.UpdateResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.SneakyThrows;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public class CustomPermissionGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<PermissionGroup>
        implements CustomPermissionGroupRepositoryCE {

    private final EntityManager entityManager;

    public CustomPermissionGroupRepositoryCEImpl(
            EntityManager entityManager,
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.entityManager = entityManager;
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission) {
        return queryBuilder()
                .spec((root, cq, cb) -> cb.and(
                        cb.isTrue(cb.function(
                                "jsonb_path_exists",
                                Boolean.class,
                                root.get(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds)),
                                cb.literal("$[*] ? (@ == \"" + userId + "\")"))),
                        cb.equal(root.get(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)), workspaceId),
                        cb.equal(
                                root.get(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)),
                                Workspace.class.getSimpleName())))
                .permission(permission)
                .all();
    }

    @Override
    public Optional<UpdateResult> updateById(String id, Update updateObj) {
        return Optional.empty(); /*
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        Query query = new Query(Criteria.where("id").is(id));
        return mongoOperations.updateFirst(query, updateObj, this.genericDomain);*/
    }

    @SneakyThrows
    @Override
    public List<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        // TODO: use permission
        final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        final CriteriaQuery<PermissionGroup> cq = cb.createQuery(PermissionGroup.class);

        final Root<PermissionGroup> root = cq.from(PermissionGroup.class);
        final Predicate predicate = cb.and(
                cb.equal(root.get(fieldName(QPermissionGroup.permissionGroup.defaultDomainId)), workspaceId),
                cb.equal(
                        root.get(fieldName(QPermissionGroup.permissionGroup.defaultDomainType)),
                        Workspace.class.getSimpleName()));

        final List<String> permissionGroups =
                new ArrayList<>(getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(permission)));
        if (!CollectionUtils.isNullOrEmpty(permissionGroups)) {
            Map<String, String> fnVars = new HashMap<>();
            fnVars.put("p", permission.getValue());
            final List<String> conditions = new ArrayList<>();
            for (var i = 0; i < permissionGroups.size(); i++) {
                fnVars.put("g" + i, permissionGroups.get(i));
                conditions.add("@ == $g" + i);
            }
            cq.where(cb.and(
                    predicate,
                    cb.function(
                            "jsonb_path_match",
                            Boolean.class,
                            root.get(fieldName(QPermissionGroup.permissionGroup.policies)),
                            cb.literal("exists($[*] ? (@.permission == $p && exists(@.permissionGroups ? ("
                                    + String.join(" || ", conditions) + "))))"),
                            cb.literal(new ObjectMapper().writeValueAsString(fnVars)))));

        } else {
            cq.where(predicate);
        }

        final TypedQuery<PermissionGroup> query = entityManager.createQuery(cq);

        // All public access is via a single permission group. Fetch the same and set the cache with it.
        return query.getResultList();
    }

    @Override
    public List<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        return Collections.emptyList(); /*
        Criteria defaultWorkspaceIdCriteria = where("defaultDomainId")
                .in(workspaceIds);
        Criteria defaultDomainTypeCriteria = where("defaultDomainType")
                .is(Workspace.class.getSimpleName());
        return queryBuilder()
                .criteria(defaultWorkspaceIdCriteria, defaultDomainTypeCriteria)
                .permission(permission)
                .all();*/
    }

    @Override
    public Optional<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return cacheableRepositoryHelper
                .evictPermissionGroupsUser(email, tenantId)
                .blockOptional();
    }

    @Override
    public Optional<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId) {
        return this.evictPermissionGroupsUser(email, tenantId);
    }

    @Override
    public Set<String> getCurrentUserPermissionGroups() {
        return super.getCurrentUserPermissionGroups();
    }

    @Override
    public Set<String> getAllPermissionGroupsIdsForUser(User user) {
        return super.getAllPermissionGroupsForUser(user);
    }

    @Override
    public List<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission) {
        return Collections.emptyList(); /*
        Criteria assignedToUserIdCriteria = where(fieldName(QPermissionGroup.permissionGroup.assignedToUserIds))
                .in(userIds);
        return queryBuilder()
                .criteria(assignedToUserIdCriteria)
                .fields(includeFields.orElse(null))
                .permission(permission.orElse(null))
                .all();*/
    }
}
