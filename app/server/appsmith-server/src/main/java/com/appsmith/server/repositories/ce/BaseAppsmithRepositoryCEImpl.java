package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
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
import java.util.Optional;
import java.util.Set;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.apache.commons.collections.CollectionUtils.isEmpty;
import static org.apache.commons.lang3.StringUtils.isBlank;

/**
 * In case you are wondering why we have two different repository implementation classes i.e.
 * BaseRepositoryImpl.java and BaseAppsmithRepositoryCEImpl.java, Arpit's comments on this might be helpful:
 * ```
 * BaseRepository is required for running any JPA queries. This doesn’t invoke any ACL permissions. This is used when
 * we wish to fetch data from the DB without ACL. For eg, Fetching a user by username during login
 * Usage example:
 * ActionCollectionRepositoryCE extends BaseRepository to power JPA queries using the ReactiveMongoRepository.
 * AppsmithRepository is the one that we should use by default (unless the use case demands that we don’t need ACL).
 * It is implemented by BaseAppsmithRepositoryCEImpl and BaseAppsmithRepositoryImpl. This interface allows us to
 * define custom Mongo queries by including the delete functionality & ACL permissions.
 * Usage example:
 * CustomActionCollectionRepositoryCE extends AppsmithRepository and then implements the functions defined there.
 * I agree that the naming is a little confusing. Open to hearing better naming suggestions so that we can improve
 * the understanding of these interfaces.
 * ```
 * Ref: https://theappsmith.slack.com/archives/CPQNLFHTN/p1669100205502599?thread_ts=1668753437.497369&cid=CPQNLFHTN
 */
@Slf4j
public abstract class BaseAppsmithRepositoryCEImpl<T extends BaseDomain> {

    protected final ReactiveMongoOperations mongoOperations;

    protected final Class<T> genericDomain;

    protected final MongoConverter mongoConverter;

    protected final CacheableRepositoryHelper cacheableRepositoryHelper;

    protected final static int NO_RECORD_LIMIT = -1;

    @Autowired
    public BaseAppsmithRepositoryCEImpl(ReactiveMongoOperations mongoOperations,
                                        MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        this.mongoOperations = mongoOperations;
        this.mongoConverter = mongoConverter;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.genericDomain = (Class<T>) GenericTypeResolver.resolveTypeArgument(getClass(), BaseAppsmithRepositoryCEImpl.class);
    }

    public Mono<Boolean> isPermissionPresentForUser(Set<Policy> policies, String permission, String username) {

        Query query = new Query(where(fieldName(QUser.user.email)).is(username));

        return mongoOperations.findOne(query, User.class)
                .flatMap(user -> getAllPermissionGroupsForUser(user))
                .map(userPermissionGroupIds -> {
                    Optional<Policy> interestingPolicyOptional = policies.stream()
                            .filter(policy -> policy.getPermission().equals(permission))
                            .findFirst();
                    if (!interestingPolicyOptional.isPresent()) {
                        return FALSE;
                    }

                    Policy interestingPolicy = interestingPolicyOptional.get();
                    Set<String> permissionGroupsIds = interestingPolicy.getPermissionGroups();
                    if (permissionGroupsIds == null || permissionGroupsIds.isEmpty()) {
                        return FALSE;
                    }

                    return userPermissionGroupIds.stream()
                            .filter(userPermissionGroupId -> permissionGroupsIds.contains(userPermissionGroupId))
                            .findFirst()
                            .map(permissionGroup -> TRUE)
                            .orElse(FALSE);
                });
    }

    public static final String fieldName(Path path) {
        return path != null ? path.getMetadata().getName() : null;
    }

    public static final Criteria notDeleted() {
        return new Criteria().andOperator(
                //Older check for deleted
                new Criteria().orOperator(
                        where(FieldName.DELETED).exists(false),
                        where(FieldName.DELETED).is(false)
                ),
                //New check for deleted
                new Criteria().orOperator(
                        where(FieldName.DELETED_AT).exists(false),
                        where(FieldName.DELETED_AT).is(null)
                )
        );
    }

    public static final Criteria userAcl(Set<String> permissionGroups, AclPermission permission) {

        // Check if the permission is being provided by any of the permission groups
        Criteria permissionGroupCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("permissionGroups").in(permissionGroups)
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
        return findById(id, null, permission);
    }

    public Mono<T> findById(String id, List<String> projectionFieldNames, AclPermission permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
                .flatMap(permissionGroups -> {
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission)));

                    if(!isEmpty(projectionFieldNames)) {
                        projectionFieldNames.stream()
                                .forEach(projectionFieldName -> {
                                    query.fields().include(projectionFieldName);
                                });
                    }

                    return mongoOperations.query(this.genericDomain)
                            .matching(query)
                            .one()
                            .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
                });
    }

    public Mono<T> updateById(String id, T resource, AclPermission permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .zipWhen(principal -> getAllPermissionGroupsForUser((User) principal))
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
                            .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
                });
    }

    public Mono<UpdateResult> updateFieldByDefaultIdAndBranchName(String defaultId, String defaultIdPath, Map<String, Object> fieldNameValueMap, String branchName,
                                                                  String branchNamePath, AclPermission permission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
                .flatMap(permissionGroups -> {
                    Query query = new Query(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups,
                            permission)));
                    query.addCriteria(Criteria.where(defaultIdPath).is(defaultId));

                    if (!isBlank(branchName)) {
                        query.addCriteria(Criteria.where(branchNamePath).is(branchName));
                    }

                    Update update = new Update();
                    fieldNameValueMap.forEach((fieldName, fieldValue) -> {
                        update.set(fieldName, fieldValue);
                    });

                    return mongoOperations.updateFirst(query, update, this.genericDomain);
                });
    }

    public Mono<UpdateResult> updateById(String id, Update updateObj, AclPermission permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
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
        return queryOne(criterias, null, aclPermission);
    }

    protected Mono<T> queryOne(List<Criteria> criterias, List<String> projectionFieldNames, AclPermission aclPermission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
                .flatMap(permissionGroups -> {
                    return mongoOperations.query(this.genericDomain)
                            .matching(createQueryWithPermission(criterias, projectionFieldNames, permissionGroups, aclPermission))
                            .one()
                            .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
                });
    }

    protected Mono<T> queryFirst(List<Criteria> criterias, AclPermission aclPermission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
                .flatMap(permissionGroups -> {
                    return mongoOperations.query(this.genericDomain)
                            .matching(createQueryWithPermission(criterias, permissionGroups, aclPermission))
                            .first()
                            .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
                });
    }

    protected Query createQueryWithPermission(List<Criteria> criterias, Set<String> permissionGroups,
                                              AclPermission aclPermission) {
        return createQueryWithPermission(criterias, null, permissionGroups, aclPermission);
    }

    protected Query createQueryWithPermission(List<Criteria> criterias, List<String> projectionFieldNames,
                                              Set<String> permissionGroups,
                                              AclPermission aclPermission) {
        Query query = new Query();
        criterias.stream()
                .forEach(criteria -> query.addCriteria(criteria));
        if (aclPermission == null) {
            query.addCriteria(new Criteria().andOperator(notDeleted()));
        } else {
            query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, aclPermission)));
        }

        if(!isEmpty(projectionFieldNames)) {
            projectionFieldNames.stream()
                    .forEach(fieldName -> query.fields().include(fieldName));
        }

        return query;
    }

    protected Mono<Long> count(List<Criteria> criterias, AclPermission aclPermission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
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
        return queryAll(criterias, includeFields, aclPermission, sort, NO_RECORD_LIMIT);
    }

    public Flux<T> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission aclPermission, Sort sort, int limit) {
        final ArrayList<Criteria> criteriaList = new ArrayList<>(criterias);
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
                .flatMapMany(permissionGroups -> queryAllWithPermissionGroups(criteriaList, includeFields, aclPermission, sort, permissionGroups, limit));
    }

    public Flux<T> queryAllWithPermissionGroups(List<Criteria> criterias,
                                                List<String> includeFields,
                                                AclPermission aclPermission,
                                                Sort sort,
                                                Set<String> permissionGroups,
                                                int limit) {
        final ArrayList<Criteria> criteriaList = new ArrayList<>(criterias);
        Query query = new Query();
        if (!CollectionUtils.isEmpty(includeFields)) {
            for (String includeField : includeFields) {
                query.fields().include(includeField);
            }
        }

        if (limit != NO_RECORD_LIMIT) {
            query.limit(limit);
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
                .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
    }

    public Mono<T> setUserPermissionsInObject(T obj) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
                .flatMap(permissionGroups -> setUserPermissionsInObject(obj, permissionGroups));
    }

    public Mono<T> setUserPermissionsInObject(T obj, Set<String> permissionGroups) {
        Set<String> permissions = new HashSet<>();

        if (CollectionUtils.isEmpty(obj.getPolicies())) {
            return Mono.just(obj);
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
        return Mono.just(obj);
    }

    public Mono<T> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, AclPermission permission) {
        final String defaultResources = fieldName(QBaseDomain.baseDomain.defaultResources);
        Criteria defaultAppIdCriteria = where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryFirst(List.of(defaultAppIdCriteria, gitSyncIdCriteria), permission);
    }

    /**
     * 1. Get all the user groups associated with the user
     * 2. Get all the permission groups associated with anonymous user
     * 3. Return the set of all the permission groups.
     *
     * @param user
     * @return
     */

    protected Mono<Set<String>> getAllPermissionGroupsForUser(User user) {

        Mono<User> userMono = Mono.just(user);
        if (user.getTenantId() == null) {
            userMono = cacheableRepositoryHelper.getDefaultTenantId()
                    .map(tenantId -> {
                        user.setTenantId(tenantId);
                        return user;
                    });
        }


        return userMono
                .flatMap(userWithTenant -> Mono.zip(
                        cacheableRepositoryHelper.getPermissionGroupsOfUser(userWithTenant),
                        getAnonymousUserPermissionGroups()
                ))
                .map(tuple -> {
                    Set<String> permissionGroups = new HashSet<>(tuple.getT1());

                    Set<String> currentUserPermissionGroups = tuple.getT1();
                    Set<String> anonymousUserPermissionGroups = tuple.getT2();

                    permissionGroups.addAll(currentUserPermissionGroups);
                    permissionGroups.addAll(anonymousUserPermissionGroups);

                    return permissionGroups;
                });
    }

    protected Mono<Set<String>> getAnonymousUserPermissionGroups() {
        return cacheableRepositoryHelper.getPermissionGroupsOfAnonymousUser();
    }

    public Mono<T> queryOne(List<Criteria> criterias, List<String> projectionFieldNames) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    criterias.add(notDeleted());
                    Query query = new Query(new Criteria().andOperator(criterias));

                    if(!isEmpty(projectionFieldNames)) {
                        projectionFieldNames.stream()
                                .forEach(projectionFieldName -> {
                                    query.fields().include(projectionFieldName);
                                });
                    }

                    return mongoOperations.query(this.genericDomain)
                            .matching(query)
                            .one();
                });
    }
}
