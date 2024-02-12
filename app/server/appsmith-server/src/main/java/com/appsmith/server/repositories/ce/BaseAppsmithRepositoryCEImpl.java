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
import com.appsmith.server.repositories.ce.params.QueryAllParams;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.WriteModel;
import com.mongodb.client.result.UpdateResult;
import com.querydsl.core.types.Path;
import jakarta.validation.constraints.NotNull;
import org.bson.Document;
import org.bson.types.ObjectId;
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
import java.util.stream.Collectors;

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

    public static final int NO_RECORD_LIMIT = -1;

    public static final int NO_SKIP = 0;

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

    public static Criteria notDeleted() {
        return new Criteria()
                .andOperator(
                        // Older check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED).exists(false),
                                        where(FieldName.DELETED).is(false)),
                        // New check for deleted
                        where(FieldName.DELETED_AT).isNull());
    }

    public static Criteria userAcl(Set<String> permissionGroups, AclPermission permission) {
        if (permission == null) {
            return null;
        }
        // Check if the permission is being provided by any of the permission groups
        return Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroups)
                        .and("permission")
                        .is(permission.getValue()));
    }

    protected Criteria getIdCriteria(Object id) {
        return where("id").is(id);
    }

    protected DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
    }

    public Mono<T> findById(String id, AclPermission permission) {
        return queryBuilder().byId(id).permission(permission).one();
    }

    /**
     * @deprecated using `Optional` for function arguments is an anti-pattern.
     */
    @Deprecated
    public Mono<T> findById(String id, Optional<AclPermission> permission) {
        return findById(id, permission.orElse(null));
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
                                Criteria userAcl = userAcl(permissionGroups, permission.orElse(null));
                                query.addCriteria(notDeleted());
                                if (userAcl != null) {
                                    query.addCriteria(userAcl);
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

        return getCurrentUserPermissionGroupsIfRequired(permission, true).flatMap(permissionGroups -> {
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
                getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(permission), true);

        return permissionGroupsMono.flatMap(permissionGroups -> {
            Query queryWithPermission = createQueryWithPermission(criteriaList, permissionGroups, permission);
            return mongoOperations.updateMulti(queryWithPermission, updateObj, this.genericDomain);
        });
    }

    protected Mono<Set<String>> getCurrentUserPermissionGroupsIfRequired(Optional<AclPermission> permission) {
        return getCurrentUserPermissionGroupsIfRequired(permission, true);
    }

    protected Mono<Set<String>> getCurrentUserPermissionGroupsIfRequired(
            Optional<AclPermission> permission, boolean includeAnonymousUserPermissions) {
        if (permission.isEmpty()) {
            return Mono.just(Set.of());
        }
        return getCurrentUserPermissionGroups(includeAnonymousUserPermissions);
    }

    public Mono<Set<String>> getCurrentUserPermissionGroups() {
        return getCurrentUserPermissionGroups(true);
    }

    protected Mono<Set<String>> getCurrentUserPermissionGroups(boolean includeAnonymousUserPermissions) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (User) ctx.getAuthentication().getPrincipal())
                .flatMap(user -> includeAnonymousUserPermissions
                        ? getAllPermissionGroupsForUser(user)
                        : getStrictPermissionGroupsForUser(user));
    }

    protected Query createQueryWithPermission(
            List<Criteria> criterias, Set<String> permissionGroups, AclPermission aclPermission) {
        return createQueryWithPermission(criterias, null, permissionGroups, aclPermission);
    }

    protected Query createQueryWithPermission(
            List<Criteria> criterias,
            List<String> projectionFieldNames,
            Set<String> permissionGroups,
            AclPermission aclPermission) {
        final ArrayList<Criteria> criteriaList = new ArrayList<>(criterias);
        criteriaList.add(notDeleted());

        final Criteria permissionCriteria = userAcl(permissionGroups, aclPermission);
        if (permissionCriteria != null) {
            criteriaList.add(permissionCriteria);
        }

        final Query query = new Query(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));

        if (!isEmpty(projectionFieldNames)) {
            query.fields().include(projectionFieldNames.toArray(new String[0]));
        }

        return query;
    }

    public QueryAllParams<T> queryBuilder() {
        return new QueryAllParams<>(this);
    }

    public Flux<T> queryAllExecute(QueryAllParams<T> params) {
        return tryGetPermissionGroups(params).flatMapMany(permissionGroups -> {
            final Query query = createQueryWithPermission(
                    params.getCriteria(), params.getFields(), permissionGroups, params.getPermission());

            if (params.getSkip() > NO_SKIP) {
                query.skip(params.getSkip());
            }

            if (params.getLimit() != NO_RECORD_LIMIT) {
                query.limit(params.getLimit());
            }

            if (params.getSort() != null) {
                query.with(params.getSort());
            }

            return mongoOperations
                    .query(this.genericDomain)
                    .matching(query.cursorBatchSize(10_000))
                    .all()
                    .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
        });
    }

    public Mono<T> queryOneExecute(QueryAllParams<T> params) {
        return tryGetPermissionGroups(params).flatMap(permissionGroups -> mongoOperations
                .query(this.genericDomain)
                .matching(createQueryWithPermission(
                                params.getCriteria(), params.getFields(), permissionGroups, params.getPermission())
                        .cursorBatchSize(10_000))
                .one()
                .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<T> queryFirstExecute(QueryAllParams<T> params) {
        return tryGetPermissionGroups(params).flatMap(permissionGroups -> mongoOperations
                .query(this.genericDomain)
                .matching(createQueryWithPermission(
                        params.getCriteria(), params.getFields(), permissionGroups, params.getPermission()))
                .first()
                .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<Long> countExecute(QueryAllParams<T> params) {
        return tryGetPermissionGroups(params)
                .flatMap(permissionGroups -> mongoOperations.count(
                        createQueryWithPermission(params.getCriteria(), permissionGroups, params.getPermission()),
                        this.genericDomain));
    }

    private Mono<Set<String>> tryGetPermissionGroups(QueryAllParams<T> params) {
        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.defer(() -> getCurrentUserPermissionGroupsIfRequired(
                        Optional.ofNullable(params.getPermission()), params.isIncludeAnonymousUserPermissions())));
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

    /**
     * 1. Get all the user groups associated with the user
     * 2. Get all the permission groups associated with anonymous user
     * 3. Return the set of all the permission groups.
     */
    protected Mono<Set<String>> getStrictPermissionGroupsForUser(User user) {

        Mono<User> userMono = Mono.just(user);
        if (user.getTenantId() == null) {
            userMono = cacheableRepositoryHelper.getDefaultTenantId().map(tenantId -> {
                user.setTenantId(tenantId);
                return user;
            });
        }

        return userMono.flatMap(cacheableRepositoryHelper::getPermissionGroupsOfUser)
                .map(HashSet::new);
    }

    protected Mono<Set<String>> getAnonymousUserPermissionGroups() {
        return cacheableRepositoryHelper.getPermissionGroupsOfAnonymousUser();
    }

    /*
    Db query methods
     */

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

        return getCurrentUserPermissionGroupsIfRequired(permission, true).flatMap(permissionGroups -> {
            query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission.get())));
            return mongoOperations.findAndModify(query, updateObj, findAndModifyOptions, this.genericDomain);
        });
    }

    public Mono<Void> bulkInsert(List<T> domainList) {
        if (CollectionUtils.isEmpty(domainList)) {
            return Mono.empty();
        }

        // convert the list of domains to a list of DBObjects
        List<Document> dbObjects = domainList.stream()
                .map(domain -> {
                    Document document = new Document();
                    mongoOperations.getConverter().write(domain, document);
                    return document;
                })
                .collect(Collectors.toList());

        return mongoOperations
                .getCollection(mongoOperations.getCollectionName(genericDomain))
                .flatMapMany(documentMongoCollection -> documentMongoCollection.insertMany(dbObjects))
                .collectList()
                .then();
    }

    public Mono<Void> bulkUpdate(List<T> domainObjects) {
        if (CollectionUtils.isEmpty(domainObjects)) {
            return Mono.empty();
        }

        // convert the list of new actions to a list of DBObjects
        List<WriteModel<Document>> dbObjects = domainObjects.stream()
                .map(actionCollection -> {
                    assert actionCollection.getId() != null;
                    Document document = new Document();
                    mongoOperations.getConverter().write(actionCollection, document);
                    document.remove("_id");
                    return (WriteModel<Document>) new UpdateOneModel<Document>(
                            new Document("_id", new ObjectId(actionCollection.getId())),
                            new Document("$set", document));
                })
                .collect(Collectors.toList());

        return mongoOperations
                .getCollection(mongoOperations.getCollectionName(genericDomain))
                .flatMapMany(documentMongoCollection -> documentMongoCollection.bulkWrite(dbObjects))
                .collectList()
                .then();
    }
}
