package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.result.UpdateResult;
import com.querydsl.core.types.Path;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import org.springframework.data.mongodb.repository.Meta;
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

import static org.apache.commons.collections.CollectionUtils.isEmpty;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static org.springframework.data.mongodb.core.query.Criteria.where;

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
public abstract class BaseAppsmithRepositoryCEImpl<T extends BaseDomain> {

    protected final ReactiveMongoOperations mongoOperations;

    protected final Class<T> genericDomain;

    protected final MongoConverter mongoConverter;

    protected final CacheableRepositoryHelper cacheableRepositoryHelper;

    protected static final int NO_RECORD_LIMIT = -1;

    protected static final int NO_SKIP = 0;

    @Autowired
    @SuppressWarnings("unchecked")
    public BaseAppsmithRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        this.mongoOperations = mongoOperations;
        this.mongoConverter = mongoConverter;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.genericDomain =
                (Class<T>) GenericTypeResolver.resolveTypeArgument(getClass(), BaseAppsmithRepositoryCEImpl.class);
    }

    public static String fieldName(Path<?> path) {
        return Optional.ofNullable(path).map(p -> p.getMetadata().getName()).orElse("");
    }

    public static String completeFieldName(@NotNull Path<?> path) {
        StringBuilder sb = new StringBuilder();

        while (!path.getMetadata().isRoot()) {
            sb.insert(0, "." + fieldName(path));
            path = path.getMetadata().getParent();
        }
        sb.deleteCharAt(0);
        return sb.toString();
    }

    public static final Criteria notDeleted() {
        return new Criteria()
                .andOperator(
                        // Older check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED).exists(false),
                                        where(FieldName.DELETED).is(false)),
                        // New check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED_AT).exists(false),
                                        where(FieldName.DELETED_AT).is(null)));
    }

    @Deprecated
    public static final Criteria userAcl(Set<String> permissionGroups, AclPermission permission) {
        Optional<Criteria> criteria = userAcl(permissionGroups, Optional.ofNullable(permission));
        return criteria.orElse(null);
    }

    public static final Optional<Criteria> userAcl(Set<String> permissionGroups, Optional<AclPermission> permission) {
        if (permission.isEmpty()) {
            return Optional.empty();
        }
        // Check if the permission is being provided by any of the permission groups
        Criteria permissionGroupCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroups)
                        .and("permission")
                        .is(permission.get().getValue()));

        return Optional.of(permissionGroupCriteria);
    }

    protected Criteria getIdCriteria(Object id) {
        return where("id").is(id);
    }

    protected DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
    }

    @Deprecated
    public Mono<T> findById(String id, AclPermission permission) {
        return findById(id, null, permission);
    }

    public Mono<T> findById(String id, List<String> projectionFieldNames, AclPermission permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return findById(id, projectionFieldNames, Optional.ofNullable(permission));
    }

    public Mono<T> findById(String id, List<String> projectionFieldNames, Optional<AclPermission> permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return getCurrentUserPermissionGroupsIfRequired(permission).flatMap(permissionGroups -> {
            Query query = new Query(getIdCriteria(id));
            query.addCriteria(notDeleted());
            Optional<Criteria> userAcl = userAcl(permissionGroups, permission);
            if (userAcl.isPresent()) {
                query.addCriteria(userAcl.get());
            }

            if (!isEmpty(projectionFieldNames)) {
                projectionFieldNames.stream().forEach(projectionFieldName -> {
                    query.fields().include(projectionFieldName);
                });
            }

            return mongoOperations
                    .query(this.genericDomain)
                    .matching(query.cursorBatchSize(10000))
                    .one()
                    .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
        });
    }

    public Mono<T> findById(String id, Optional<AclPermission> permission) {
        return findById(id, null, permission);
    }

    @Deprecated
    public Mono<T> updateById(String id, T resource, AclPermission permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        if (resource == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return updateById(id, resource, Optional.ofNullable(permission));
    }

    public Mono<T> updateById(String id, T resource, Optional<AclPermission> permission) {
        Query query = new Query(Criteria.where("id").is(id));

        // Set policies to null in the update object
        resource.setPolicies(null);
        resource.setUpdatedAt(Instant.now());

        DBObject update = getDbObject(resource);
        Update updateObj = new Update();
        update.keySet().stream().forEach(entry -> updateObj.set(entry, update.get(entry)));

        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> (User) auth.getPrincipal())
                .flatMap(user -> {
                    resource.setModifiedBy(user.getUsername());
                    return (permission.isPresent() ? getAllPermissionGroupsForUser(user) : Mono.just(Set.<String>of()))
                            .flatMap(permissionGroups -> {
                                Optional<Criteria> userAcl = userAcl(permissionGroups, permission);
                                query.addCriteria(notDeleted());
                                if (userAcl.isPresent()) {
                                    query.addCriteria(userAcl.get());
                                }
                                return mongoOperations
                                        .updateFirst(query, updateObj, resource.getClass())
                                        .flatMap(obj -> {
                                            if (obj.getMatchedCount() == 0) {
                                                return Mono.error(new AppsmithException(
                                                        AppsmithError.NO_RESOURCE_FOUND,
                                                        resource.getClass()
                                                                .getSimpleName()
                                                                .toLowerCase(),
                                                        id));
                                            }
                                            return findById(id, permission);
                                        })
                                        .flatMap(obj -> {
                                            return setUserPermissionsInObject(obj, permissionGroups);
                                        });
                            });
                });
    }

    public Mono<UpdateResult> updateFieldByDefaultIdAndBranchName(
            String defaultId,
            String defaultIdPath,
            Map<String, Object> fieldNameValueMap,
            String branchName,
            String branchNamePath,
            AclPermission permission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal))
                .flatMap(permissionGroups -> {
                    Query query =
                            new Query(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission)));
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
        if (updateObj == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return updateById(id, updateObj, Optional.ofNullable(permission));
    }

    public Mono<UpdateResult> updateById(String id, Update updateObj, Optional<AclPermission> permission) {
        Query query = new Query(Criteria.where("id").is(id));

        if (permission.isEmpty()) {
            return mongoOperations.updateFirst(query, updateObj, this.genericDomain);
        }

        return getCurrentUserPermissionGroupsIfRequired(permission).flatMap(permissionGroups -> {
            query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission.get())));
            return mongoOperations.updateFirst(query, updateObj, this.genericDomain);
        });
    }

    public Mono<UpdateResult> updateByCriteria(
            List<Criteria> criteriaList, UpdateDefinition updateObj, AclPermission permission) {
        if (criteriaList == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "criteriaList"));
        }
        if (updateObj == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "updateObj"));
        }
        Mono<Set<String>> permissionGroupsMono =
                getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(permission));

        return permissionGroupsMono.flatMap(permissionGroups -> {
            Query queryWithPermission = createQueryWithPermission(criteriaList, permissionGroups, permission);
            return mongoOperations.updateMulti(queryWithPermission, updateObj, this.genericDomain);
        });
    }

    @Deprecated
    protected Mono<T> queryOne(List<Criteria> criterias, AclPermission aclPermission) {
        return queryOne(criterias, null, Optional.ofNullable(aclPermission));
    }

    protected Mono<Set<String>> getCurrentUserPermissionGroupsIfRequired(Optional<AclPermission> permission) {
        if (permission.isEmpty()) {
            return Mono.just(Set.of());
        }
        return getCurrentUserPermissionGroups();
    }

    protected Mono<Set<String>> getCurrentUserPermissionGroups() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> getAllPermissionGroupsForUser((User) principal));
    }

    protected Mono<T> queryOne(List<Criteria> criterias, List<String> projectionFieldNames, AclPermission permission) {
        Mono<Set<String>> permissionGroupsMono =
                getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(permission));

        return permissionGroupsMono.flatMap(permissionGroups -> {
            return mongoOperations
                    .query(this.genericDomain)
                    .matching(createQueryWithPermission(criterias, projectionFieldNames, permissionGroups, permission))
                    .one()
                    .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
        });
    }

    @Meta(cursorBatchSize = 10000)
    protected Mono<T> queryOne(
            List<Criteria> criterias, List<String> projectionFieldNames, Optional<AclPermission> permission) {
        Mono<Set<String>> permissionGroupsMono = getCurrentUserPermissionGroupsIfRequired(permission);

        return permissionGroupsMono.flatMap(permissionGroups -> {
            return mongoOperations
                    .query(this.genericDomain)
                    .matching(createQueryWithPermission(criterias, projectionFieldNames, permissionGroups, permission))
                    .one()
                    .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
        });
    }

    @Deprecated
    protected Mono<T> queryFirst(List<Criteria> criterias, AclPermission aclPermission) {
        return queryFirst(criterias, Optional.ofNullable(aclPermission));
    }

    protected Mono<T> queryFirst(List<Criteria> criterias, Optional<AclPermission> permission) {
        Mono<Set<String>> permissionGroupsMono = getCurrentUserPermissionGroupsIfRequired(permission);

        return permissionGroupsMono.flatMap(permissionGroups -> {
            return mongoOperations
                    .query(this.genericDomain)
                    .matching(createQueryWithPermission(criterias, null, permissionGroups, permission))
                    .first()
                    .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
        });
    }

    @Deprecated
    protected Query createQueryWithPermission(
            List<Criteria> criterias, Set<String> permissionGroups, AclPermission aclPermission) {
        return createQueryWithPermission(criterias, null, permissionGroups, aclPermission);
    }

    protected Query createQueryWithPermission(
            List<Criteria> criterias, Set<String> permissionGroups, Optional<AclPermission> permission) {
        return createQueryWithPermission(criterias, null, permissionGroups, permission.orElse(null));
    }

    protected Query createQueryWithPermission(
            List<Criteria> criterias,
            List<String> projectionFieldNames,
            Set<String> permissionGroups,
            Optional<AclPermission> permission) {

        return createQueryWithPermission(criterias, projectionFieldNames, permissionGroups, permission.orElse(null));
    }

    protected Query createQueryWithPermission(
            List<Criteria> criterias,
            List<String> projectionFieldNames,
            Set<String> permissionGroups,
            AclPermission aclPermission) {
        Query query = new Query();
        criterias.stream().forEach(criteria -> query.addCriteria(criteria));
        if (aclPermission == null) {
            query.addCriteria(new Criteria().andOperator(notDeleted()));
        } else {
            query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, aclPermission)));
        }

        if (!isEmpty(projectionFieldNames)) {
            projectionFieldNames.stream().forEach(fieldName -> query.fields().include(fieldName));
        }

        return query;
    }

    @Deprecated
    protected Mono<Long> count(List<Criteria> criterias, AclPermission aclPermission) {
        return count(criterias, Optional.ofNullable(aclPermission));
    }

    protected Mono<Long> count(List<Criteria> criterias, Optional<AclPermission> permission) {
        Mono<Set<String>> permissionGroupsMono = getCurrentUserPermissionGroupsIfRequired(permission);

        return permissionGroupsMono.flatMap(permissionGroups -> mongoOperations.count(
                createQueryWithPermission(criterias, permissionGroups, permission), this.genericDomain));
    }

    protected Mono<Long> count(List<Criteria> criteriaList) {
        return count(criteriaList, Optional.empty());
    }

    @Deprecated
    public Flux<T> queryAll(List<Criteria> criterias, AclPermission aclPermission) {
        return queryAll(
                criterias, Optional.empty(), Optional.ofNullable(aclPermission), Optional.empty(), NO_RECORD_LIMIT);
    }

    public Flux<T> queryAll(List<Criteria> criterias, Optional<AclPermission> permission) {
        return queryAll(criterias, permission, Optional.empty());
    }

    @Deprecated
    public Flux<T> queryAll(List<Criteria> criterias, AclPermission aclPermission, Sort sort) {
        return queryAll(
                criterias,
                Optional.empty(),
                Optional.ofNullable(aclPermission),
                Optional.ofNullable(sort),
                NO_RECORD_LIMIT);
    }

    public Flux<T> queryAll(List<Criteria> criterias, Optional<AclPermission> permission, Optional<Sort> sort) {
        return queryAll(criterias, Optional.empty(), permission, sort, NO_RECORD_LIMIT);
    }

    @Deprecated
    public Flux<T> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission aclPermission, Sort sort) {
        return queryAll(
                criterias,
                Optional.ofNullable(includeFields),
                Optional.ofNullable(aclPermission),
                Optional.ofNullable(sort),
                NO_RECORD_LIMIT);
    }

    public Flux<T> queryAll(
            List<Criteria> criterias,
            Optional<List<String>> includeFields,
            Optional<AclPermission> aclPermission,
            Optional<Sort> sort) {
        return queryAll(criterias, includeFields, aclPermission, sort, NO_RECORD_LIMIT);
    }

    @Deprecated
    public Flux<T> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission aclPermission, Sort sort, int limit) {
        return queryAll(
                criterias,
                Optional.ofNullable(includeFields),
                Optional.ofNullable(aclPermission),
                Optional.ofNullable(sort),
                limit);
    }

    public Flux<T> queryAll(
            List<Criteria> criterias,
            Optional<List<String>> includeFields,
            Optional<AclPermission> permission,
            Optional<Sort> sort,
            int limit) {
        Mono<Set<String>> permissionGroupsMono = getCurrentUserPermissionGroupsIfRequired(permission);
        return permissionGroupsMono.flatMapMany(permissionGroups -> queryAllWithPermissionGroups(
                criterias, includeFields, permission, sort, permissionGroups, limit, NO_SKIP));
    }

    public Flux<T> queryAll(
            List<Criteria> criterias,
            Optional<List<String>> includeFields,
            Optional<AclPermission> permission,
            Sort sort,
            int limit,
            int skip) {
        Mono<Set<String>> permissionGroupsMono = getCurrentUserPermissionGroupsIfRequired(permission);
        return permissionGroupsMono.flatMapMany(permissionGroups -> queryAllWithPermissionGroups(
                criterias, includeFields, permission, Optional.of(sort), permissionGroups, limit, skip));
    }

    @Deprecated
    public Flux<T> queryAllWithPermissionGroups(
            List<Criteria> criterias,
            List<String> includeFields,
            AclPermission aclPermission,
            Sort sort,
            Set<String> permissionGroups,
            int limit) {
        return queryAllWithPermissionGroups(
                criterias,
                Optional.ofNullable(includeFields),
                Optional.ofNullable(aclPermission),
                Optional.ofNullable(sort),
                permissionGroups,
                limit,
                NO_SKIP);
    }

    public Flux<T> queryAllWithPermissionGroups(
            List<Criteria> criterias,
            Optional<List<String>> includeFields,
            Optional<AclPermission> aclPermission,
            Optional<Sort> sortOptional,
            Set<String> permissionGroups,
            int limit,
            int skip) {
        final ArrayList<Criteria> criteriaList = new ArrayList<>(criterias);
        Query query = new Query();
        includeFields.ifPresent(fields -> {
            fields.forEach(field -> query.fields().include(field));
        });
        if (skip > NO_SKIP) {
            query.skip(skip);
        }
        if (limit != NO_RECORD_LIMIT) {
            query.limit(limit);
        }
        Criteria andCriteria = new Criteria();
        criteriaList.add(notDeleted());
        userAcl(permissionGroups, aclPermission).ifPresent(criteria -> criteriaList.add(criteria));
        andCriteria.andOperator(criteriaList.toArray(new Criteria[0]));
        query.addCriteria(andCriteria);
        sortOptional.ifPresent(sort -> query.with(sort));
        return mongoOperations
                .query(this.genericDomain)
                .matching(query.cursorBatchSize(10000))
                .all()
                .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
    }

    public Mono<T> setUserPermissionsInObject(T obj) {
        return getCurrentUserPermissionGroups()
                .flatMap(permissionGroups -> setUserPermissionsInObject(obj, permissionGroups));
    }

    public Mono<T> setUserPermissionsInObject(T obj, Set<String> permissionGroups) {
        Set<String> permissions = new HashSet<>();
        obj.setUserPermissions(permissions);

        if (CollectionUtils.isEmpty(obj.getPolicies()) || permissionGroups.isEmpty()) {
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

        return Mono.just(obj);
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
            userMono = cacheableRepositoryHelper.getDefaultTenantId().map(tenantId -> {
                user.setTenantId(tenantId);
                return user;
            });
        }

        return userMono.flatMap(userWithTenant -> Mono.zip(
                        cacheableRepositoryHelper.getPermissionGroupsOfUser(userWithTenant),
                        getAnonymousUserPermissionGroups()))
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

                    if (!isEmpty(projectionFieldNames)) {
                        projectionFieldNames.stream().forEach(projectionFieldName -> {
                            query.fields().include(projectionFieldName);
                        });
                    }

                    return mongoOperations
                            .query(this.genericDomain)
                            .matching(query)
                            .one();
                });
    }

    public static Query getQuery(List<Criteria> criteria) {
        Query query = new Query();
        criteria.forEach(query::addCriteria);
        return query;
    }

    /*
    Db query methods
     */

    public Mono<T> queryOne(List<Criteria> criteria) {
        return mongoOperations.findOne(getQuery(criteria), genericDomain);
    }

    public Flux<T> queryMany(List<Criteria> criteria) {
        return mongoOperations.find(getQuery(criteria), genericDomain);
    }

    public Flux<T> queryAllWithoutPermissions(
            List<Criteria> criterias, List<String> includeFields, Sort sort, int limit) {
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

        andCriteria.andOperator(criteriaList.toArray(new Criteria[0]));

        query.addCriteria(andCriteria);
        if (sort != null) {
            query.with(sort);
        }

        return mongoOperations.query(this.genericDomain).matching(query).all().map(obj -> obj);
    }

    /**
     * Updates a document in the database that matches the provided query and returns the modified document.
     *
     * This method performs a find-and-modify operation internally to atomically update a document in the database.
     *
     * @param id The unique identifier of the document to be updated.
     * @param updateObj The update object specifying the modifications to be applied to the document.
     * @param permission An optional permission parameter for access control.
     * @return A Mono emitting the updated document after modification.
     *
     * @implNote
     * The `findAndModify` method operates at the database level and does not automatically handle encryption or decryption of fields. If the document contains encrypted fields, it is the responsibility of the caller to handle encryption and decryption both before and after using this method.
     *
     * @see FindAndModifyOptions
     */
    public Mono<T> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        Query query = new Query(Criteria.where("id").is(id));

        FindAndModifyOptions findAndModifyOptions =
                FindAndModifyOptions.options().returnNew(Boolean.TRUE);

        if (permission.isEmpty()) {
            return mongoOperations.findAndModify(query, updateObj, findAndModifyOptions, this.genericDomain);
        }

        return getCurrentUserPermissionGroupsIfRequired(permission).flatMap(permissionGroups -> {
            query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission.get())));
            return mongoOperations.findAndModify(query, updateObj, findAndModifyOptions, this.genericDomain);
        });
    }
}
