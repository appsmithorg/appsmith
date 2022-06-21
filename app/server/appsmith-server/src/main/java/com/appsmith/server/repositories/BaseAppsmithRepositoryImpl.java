package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.QRbacPolicy;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.QUserInGroup;
import com.appsmith.server.domains.RbacPolicy;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.result.UpdateResult;
import com.querydsl.core.types.Path;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public abstract class BaseAppsmithRepositoryImpl<T extends BaseDomain> {

    protected final ReactiveMongoOperations mongoOperations;

    private final Class<T> genericDomain;

    protected final MongoConverter mongoConverter;

    @Autowired
    public BaseAppsmithRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                      MongoConverter mongoConverter) {
        this.mongoOperations = mongoOperations;
        this.mongoConverter = mongoConverter;
        this.genericDomain = (Class<T>) GenericTypeResolver.resolveTypeArgument(getClass(), BaseAppsmithRepositoryImpl.class);
    }

    /**
     * 1. Get all the user groups associated with the user
     * 2. Get all the permission groups associated with all the user groups from step 1
     * 3. Return the set of all the permission groups.
     * @param user
     * @return
     */
    protected Mono<Set<String>> getCurrentPermissionGroups(User user) {

        return findAllUserGroupsByUserId(user.getId())
                .map(UserGroup::getId)
                .collect(Collectors.toSet())
                .flatMap(userGroupIds -> findAllPermissionGroups(user.getId(), userGroupIds));
    }

    private Flux<UserGroup> findAllUserGroupsByUserId(String userId) {
        Criteria userIdCriteria = Criteria.where(fieldName(QUserGroup.userGroup.users))
                .elemMatch(Criteria.where(fieldName(QUserInGroup.userInGroup.id)).is(userId));

        Query query = new Query();
        query.addCriteria(userIdCriteria);
        return mongoOperations.find(query, UserGroup.class);
    }

    private Mono<Set<String>> findAllPermissionGroups(String userId, Set<String> userGroupIds) {
        Criteria userGroupIdsCriteria = Criteria.where(fieldName(QRbacPolicy.rbacPolicy.userGroupId))
                .in(userGroupIds);
        Criteria userIdCriteria = Criteria.where(fieldName(QRbacPolicy.rbacPolicy.userId)).is(userId);

        Criteria userOrUserGroupCriteria = new Criteria().orOperator(userGroupIdsCriteria, userIdCriteria);

        Query query = new Query();
        query.addCriteria(userOrUserGroupCriteria);
        return mongoOperations.find(query, RbacPolicy.class)
                .flatMap(policy -> Flux.fromIterable(policy.getPermissionGroupIds()))
                .collect(Collectors.toSet());

    }

    public static final String fieldName(Path path) {
        return path != null ? path.getMetadata().getName() : null;
    }

    public static final Criteria notDeleted() {
        return new Criteria().orOperator(
                where(fieldName(QBaseDomain.baseDomain.deleted)).exists(false),
                where(fieldName(QBaseDomain.baseDomain.deleted)).is(false)
        );
    }

    public static final Criteria userAcl(Set<String> permissionGroups, AclPermission permission) {
        Criteria permissionGroupCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("permissionGroups").all(permissionGroups)
                        .and("permission").is(permission.getValue()));

        return permissionGroupCriteria;
    }

    protected Criteria getIdCriteria(Object id) {
        return where("id").is(id);
    }

    private Criteria getBranchCriteria(String branchName) {
        return where(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME).is(branchName);
    }

    protected DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
    }

    public Mono<T> findById(String id, AclPermission permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getCurrentPermissionGroups((User) principal))
                .flatMap(permissionGroups -> {
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission)));

                    return mongoOperations.query(this.genericDomain)
                            .matching(query)
                            .one()
                            .map(obj -> (T) setUserPermissionsInObject(obj, permissionGroups));
                });
    }

    public Mono<T> updateById(String id, T resource, AclPermission permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .zipWhen(principal -> getCurrentPermissionGroups((User) principal))
                .flatMap(touple -> {
                    User user = (User) touple.getT1();
                    Set<String> permissionGroups = touple.getT2();
                    Query query = new Query(Criteria.where("id").is(id));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission)));

                    // Set policies to null in the update object
                    resource.setPolicies(null);
                    resource.setUpdatedAt(Instant.now());
                    resource.setModifiedBy(user.getUsername());

                    DBObject update = getDbObject(resource);
                    Update updateObj = new Update();
                    Map<String, Object> updateMap = update.toMap();
                    updateMap.entrySet().stream().forEach(entry -> updateObj.set(entry.getKey(), entry.getValue()));

                    return mongoOperations.updateFirst(query, updateObj, resource.getClass())
                            .flatMap(obj -> {
                                if (obj.getMatchedCount() == 0) {
                                    return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, resource.getClass().getSimpleName().toLowerCase(), id));
                                }
                                return findById(id, permission);
                            })
                            .map(obj -> (T) setUserPermissionsInObject(obj, permissionGroups));
                });
    }

    public Mono<UpdateResult> updateById(String id, Update updateObj, AclPermission permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getCurrentPermissionGroups((User) principal))
                .flatMap(permissionGroups -> {
                    Query query = new Query(Criteria.where("id").is(id));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission)));
                    return mongoOperations.updateFirst(query, updateObj, this.genericDomain);
                });
    }

    public Mono<UpdateResult> updateByCriteria(List<Criteria> criteriaList, Update updateObj) {
        if (criteriaList == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "criteriaList"));
        }
        List<Criteria> allCriterias = new ArrayList<>(criteriaList);
        allCriterias.add(notDeleted());
        Query query = new Query(new Criteria().andOperator(allCriterias));
        return mongoOperations.updateMulti(query, updateObj, this.genericDomain);
    }

    protected Mono<T> queryOne(List<Criteria> criterias, AclPermission aclPermission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getCurrentPermissionGroups((User) principal))
                .flatMap(permissionGroups -> {
                    return mongoOperations.query(this.genericDomain)
                            .matching(createQueryWithPermission(criterias, permissionGroups, aclPermission))
                            .one()
                            .map(obj -> (T) setUserPermissionsInObject(obj, permissionGroups));
                });
    }

    protected Mono<T> queryFirst(List<Criteria> criterias, AclPermission aclPermission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getCurrentPermissionGroups((User) principal))
                .flatMap(permissionGroups -> {
                    return mongoOperations.query(this.genericDomain)
                            .matching(createQueryWithPermission(criterias, permissionGroups, aclPermission))
                            .first()
                            .map(obj -> (T) setUserPermissionsInObject(obj, permissionGroups));
                });
    }

    protected Query createQueryWithPermission(List<Criteria> criterias, Set<String> permissionGroups, AclPermission aclPermission) {
        Query query = new Query();
        criterias.stream()
                .forEach(criteria -> query.addCriteria(criteria));
        if (aclPermission == null) {
            query.addCriteria(new Criteria().andOperator(notDeleted()));
        } else {
            query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, aclPermission)));
        }
        return query;
    }

    protected Mono<Long> count(List<Criteria> criterias, AclPermission aclPermission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getCurrentPermissionGroups((User) principal))
                .flatMap(permissionGroups ->
                    mongoOperations.count(
                            createQueryWithPermission(criterias, permissionGroups, aclPermission), this.genericDomain
                    )
                );
    }

    protected Mono<Long> count(List<Criteria> criteriaList) {
        return mongoOperations.count(
                createQueryWithPermission(criteriaList, null, null), this.genericDomain
        );
    }

    public Flux<T> queryAll(List<Criteria> criterias, AclPermission aclPermission) {
        return queryAll(criterias, aclPermission, null);
    }

    public Flux<T> queryAll(List<Criteria> criterias, AclPermission aclPermission, Sort sort) {
        return queryAll(criterias, null, aclPermission, sort);
    }

    public Flux<T> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission aclPermission, Sort sort) {
        final ArrayList<Criteria> criteriaList = new ArrayList<>(criterias);
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getCurrentPermissionGroups((User) principal))
                .flatMapMany(permissionGroups -> {
                    Query query = new Query();
                    if(!CollectionUtils.isEmpty(includeFields)) {
                        for(String includeField: includeFields) {
                            query.fields().include(includeField);
                        }
                    }
                    Criteria andCriteria = new Criteria();

                    criteriaList.add(notDeleted());
                    if (aclPermission != null) {
                        criteriaList.add(userAcl(permissionGroups, aclPermission));
                    }

                    andCriteria.andOperator(criteriaList.toArray(new Criteria[0]));

                    query.addCriteria(andCriteria);
                    if (sort != null) {
                        query.with(sort);
                    }

                    return mongoOperations.query(this.genericDomain)
                            .matching(query)
                            .all()
                            .map(obj -> (T) setUserPermissionsInObject(obj, permissionGroups));
                });
    }

    public T setUserPermissionsInObject(T obj, Set<String> permissionGroups) {
        Set<String> permissions = new HashSet<>();

        if(CollectionUtils.isEmpty(obj.getPolicies())) {
            return obj;
        }

        for (Policy policy : obj.getPolicies()) {
            Set<String> policyPermissionGroups = policy.getPermissionGroups();
            if (CollectionUtils.isEmpty(policyPermissionGroups)) {
                continue;
            }
            for (String permissionGroup : permissionGroups) {
                if (policyPermissionGroups.contains(permissionGroup)) {
                    permissions.add(policy.getPermission());
                    break;
                }
            }
        }

        obj.setUserPermissions(permissions);
        return obj;
    }

    public Mono<T> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, AclPermission permission) {
        final String defaultResources = fieldName(QBaseDomain.baseDomain.defaultResources);
        Criteria defaultAppIdCriteria = where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryFirst(List.of(defaultAppIdCriteria, gitSyncIdCriteria), permission);
    }

}
