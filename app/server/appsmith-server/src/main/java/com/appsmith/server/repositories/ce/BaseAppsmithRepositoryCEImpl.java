package com.appsmith.server.repositories.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.ce.params.QueryAllParams;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.querydsl.core.types.Path;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.CriteriaUpdate;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.transaction.Transactional;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NonNull;
import lombok.SneakyThrows;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
public abstract class BaseAppsmithRepositoryCEImpl<T extends BaseDomain> implements AppsmithRepository<T> {

    @Autowired // TODO: Add constructor parameter.
    @Getter
    private EntityManager entityManager;

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
        return Criteria.where(BaseDomain.Fields.policies)
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

    public Optional<T> findById(String id, AclPermission permission) {
        return queryBuilder().byId(id).permission(permission).one();
    }

    public Optional<T> findById(String id, List<String> projectionFieldNames, AclPermission permission) {
        return queryBuilder()
                .byId(id)
                .fields(projectionFieldNames)
                .permission(permission)
                .one();
    }

    /**
     * @deprecated using `Optional` for function arguments is an anti-pattern.
     */
    @Deprecated
    public Optional<T> findById(String id, Optional<AclPermission> permission) {
        return findById(id, permission.orElse(null));
    }

    @Deprecated
    @Transactional
    @Modifying
    public Optional<T> updateById(String id, T resource, AclPermission permission) {
        if (id == null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID);
        }
        if (resource == null) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "resource");
        }

        // Set policies to null in the update object
        resource.setPolicies(null);
        resource.setUpdatedAt(Instant.now());

        final User user = ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (User) ctx.getAuthentication().getPrincipal())
                .block();

        final Set<String> permissionGroups = permission != null ? getAllPermissionGroupsForUser(user) : Set.of();

        return Optional.of(findById(id, permission)
                .map(entityFromDB -> {
                    entityFromDB.setModifiedBy(user.getUsername());
                    AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(
                            resource, entityFromDB, Set.of(FieldName.ID, "policies"));
                    entityFromDB.setUpdatedAt(Instant.now());
                    entityManager.persist(entityFromDB);
                    return setUserPermissionsInObject(entityFromDB, permissionGroups);
                })
                .orElseThrow(() -> new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND,
                        genericDomain.getSimpleName().toLowerCase(),
                        id))); // */
    }

    public Optional<Integer> updateFieldByDefaultIdAndBranchName(
            String defaultId,
            String defaultIdPath,
            Map<String, Object> fieldNameValueMap,
            String branchName,
            String branchNamePath,
            AclPermission permission) {
        final QueryAllParams<T> builder = queryBuilder();

        builder.criteria(Criteria.where(defaultIdPath).is(defaultId));

        if (!isBlank(branchName)) {
            builder.criteria(Criteria.where(branchNamePath).is(branchName));
        }

        BridgeUpdate update = Bridge.update();
        fieldNameValueMap.forEach(update::set);

        final int count = builder.permission(permission).updateFirst(update);
        return Optional.of(count);
    }

    protected Set<String> getCurrentUserPermissionGroupsIfRequired(Optional<AclPermission> permission) {
        return getCurrentUserPermissionGroupsIfRequired(permission, true);
    }

    protected Set<String> getCurrentUserPermissionGroupsIfRequired(
            Optional<AclPermission> permission, boolean includeAnonymousUserPermissions) {
        if (permission.isEmpty()) {
            return Set.of();
        }
        return getCurrentUserPermissionGroups(includeAnonymousUserPermissions);
    }

    public Set<String> getCurrentUserPermissionGroups() {
        return getCurrentUserPermissionGroups(true);
    }

    protected Set<String> getCurrentUserPermissionGroups(boolean includeAnonymousUserPermissions) {
        final Set<String> permissionGroups = ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication().getPrincipal())
                .map(principal -> getAllPermissionGroupsForUser((User) principal))
                .block();
        return permissionGroups == null ? Collections.emptySet() : permissionGroups;
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

    @SneakyThrows
    public List<T> queryAllExecute(QueryAllParams<T> params) {
        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.defer(() -> Mono.just(
                        getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(params.getPermission())))))
                .map(ArrayList::new)
                .flatMap(permissionGroups -> {
                    final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
                    final CriteriaQuery<T> cq = cb.createQuery(genericDomain);
                    final Root<T> root = cq.from(genericDomain);

                    final List<Specification<T>> specifications = new ArrayList<>(params.getSpecifications());

                    Predicate predicate = cb.and(
                            Specification.allOf(specifications).toPredicate(root, cq, cb),
                            root.get(FieldName.DELETED_AT).isNull());

                    if (!permissionGroups.isEmpty()) {
                        Map<String, String> fnVars = new HashMap<>();
                        fnVars.put("p", params.getPermission().getValue());
                        final List<String> conditions = new ArrayList<>();
                        for (var i = 0; i < permissionGroups.size(); i++) {
                            fnVars.put("g" + i, permissionGroups.get(i));
                            conditions.add("@ == $g" + i);
                        }

                        try {
                            predicate = cb.and(
                                    predicate,
                                    cb.isTrue(cb.function(
                                            "jsonb_path_exists",
                                            Boolean.class,
                                            root.get(PermissionGroup.Fields.policies),
                                            cb.literal("$[*] ? (@.permission == $p && exists(@.permissionGroups ? ("
                                                    + String.join(" || ", conditions) + ")))"),
                                            cb.literal(new ObjectMapper().writeValueAsString(fnVars)))));
                        } catch (JsonProcessingException e) {
                            // This should never happen, were serializing a Map<String, String>, which ideally should
                            // never fail.
                            throw new RuntimeException(e);
                        }
                    }

                    cq.where(predicate);

                    // TODO: Projections

                    // TODO: Limits

                    // TODO: Sorting
                    // cq.orderBy(cb.desc(root.get(FieldName.CREATED_AT)));

                    // All public access is via a single permission group. Fetch the same and set the cache with it.
                    return Mono.fromSupplier(entityManager.createQuery(cq)::getResultList)
                            .onErrorResume(NoResultException.class, e -> Mono.empty())
                            .map(items -> items.stream()
                                    .map(item -> setUserPermissionsInObject(item, permissionGroups))
                                    .toList());
                })
                .block();
    }

    public Optional<T> queryOneExecute(QueryAllParams<T> params) {
        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.defer(() -> Mono.just(
                        getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(params.getPermission())))))
                .map(ArrayList::new)
                .flatMap(permissionGroups -> {
                    final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
                    final CriteriaQuery<T> cq = cb.createQuery(genericDomain);
                    final Root<T> root = cq.from(genericDomain);

                    final List<Specification<T>> specifications = new ArrayList<>(params.getSpecifications());

                    Predicate predicate = cb.and(
                            Specification.allOf(specifications).toPredicate(root, cq, cb),
                            root.get(FieldName.DELETED_AT).isNull());

                    if (!permissionGroups.isEmpty()) {
                        Map<String, String> fnVars = new HashMap<>();
                        fnVars.put("p", params.getPermission().getValue());
                        final List<String> conditions = new ArrayList<>();
                        for (var i = 0; i < permissionGroups.size(); i++) {
                            fnVars.put("g" + i, permissionGroups.get(i));
                            conditions.add("@ == $g" + i);
                        }

                        try {
                            predicate = cb.and(
                                    predicate,
                                    cb.isTrue(cb.function(
                                            "jsonb_path_exists",
                                            Boolean.class,
                                            root.get(PermissionGroup.Fields.policies),
                                            cb.literal("$[*] ? (@.permission == $p && exists(@.permissionGroups ? ("
                                                    + String.join(" || ", conditions) + ")))"),
                                            cb.literal(new ObjectMapper().writeValueAsString(fnVars)))));
                        } catch (JsonProcessingException e) {
                            // This should never happen, were serializing a Map<String, String>, which ideally should
                            // never fail.
                            throw new RuntimeException(e);
                        }
                    }

                    cq.where(predicate);

                    // All public access is via a single permission group. Fetch the same and set the cache with it.
                    return Mono.fromSupplier(entityManager.createQuery(cq)::getSingleResult)
                            .onErrorResume(NoResultException.class, e -> Mono.empty())
                            .map(obj -> setUserPermissionsInObject(obj, permissionGroups));
                })
                .blockOptional();
    }

    public Mono<T> queryFirstExecute(QueryAllParams<T> params) {
        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.defer(() -> Mono.just(
                        getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(params.getPermission())))))
                .flatMap(permissionGroups1 -> mongoOperations
                        .query(this.genericDomain)
                        .matching(createQueryWithPermission(
                                params.getCriteria(), params.getFields(), permissionGroups1, params.getPermission()))
                        .first()
                        .flatMap(obj -> Mono.just(setUserPermissionsInObject(obj, permissionGroups1)))); // */
    }

    public Optional<Long> countExecute(QueryAllParams<T> params) {
        return ensurePermissionGroupsInParams(params)
                .then(Mono.defer(() -> mongoOperations.count(
                        createQueryWithPermission(
                                params.getCriteria(), params.getPermissionGroups(), params.getPermission()),
                        this.genericDomain)))
                .blockOptional();
    }

    public int updateExecute(@NonNull QueryAllParams<T> params, @NonNull T resource) {
        final BridgeUpdate update = new BridgeUpdate();

        // In case the update is not used to update the policies, then set the policies to null to ensure that the
        // existing policies are not overwritten.
        if (resource.getPolicies().isEmpty()) {
            resource.setPolicies(null);
        }

        final Map<String, Object> updateMap = getDbObject(resource).toMap();
        for (Map.Entry<String, Object> entry : updateMap.entrySet()) {
            update.set(entry.getKey(), entry.getValue());
        }

        return updateExecute(params, update);
    }

    public Mono<Integer> updateExecute(@NonNull QueryAllParams<T> params, @NonNull UpdateDefinition update) {
        Objects.requireNonNull(params.getCriteria());

        if (!isEmpty(params.getFields())) {
            // Specifying fields to update doesn't make any sense, so explicitly disallow it.
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "fields"));
        }

        return ensurePermissionGroupsInParams(params)
                .then(Mono.defer(() -> {
                    final Query query = createQueryWithPermission(
                            params.getCriteria(), null, params.getPermissionGroups(), params.getPermission());
                    if (QueryAllParams.Scope.ALL.equals(params.getScope())) {
                        return mongoOperations.updateMulti(query, update, genericDomain);
                    } else if (QueryAllParams.Scope.FIRST.equals(params.getScope())) {
                        return mongoOperations.updateFirst(query, update, genericDomain);
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "scope"));
                    }
                }))
                .map(updateResult -> Math.toIntExact(updateResult.getMatchedCount()));
    }

    public Mono<T> updateExecuteAndFind(@NonNull QueryAllParams<T> params, @NonNull UpdateDefinition update) {
        if (QueryAllParams.Scope.ALL.equals(params.getScope())) {
            // Not implemented yet, since not needed yet.
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "scope"));

        } else if (QueryAllParams.Scope.FIRST.equals(params.getScope())) {
            return updateExecute(params, update)
                    .then(Mono.fromSupplier(() -> queryOneExecute(params).orElse(null)));

        } else {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "scope"));
        }
    }

    /**
     * This method will try to ensure that permission groups are present in the params. If they're already there, don't
     * do anything. If not, and if a `permission` is available, then get the permission groups for the current user and
     * permission and fill that into the `params` object.
     * @param params that may have permission groups already, and a permission that can be used to get permission groups otherwise.
     * @return the same `params` object, but with permission groups filled in.
     */
    private Mono<Void> ensurePermissionGroupsInParams(QueryAllParams<T> params) {
        if (params.getPermissionGroups() != null) {
            return Mono.empty();
        }

        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.fromSupplier(() -> getCurrentUserPermissionGroupsIfRequired(
                        Optional.ofNullable(params.getPermission()), params.isIncludeAnonymousUserPermissions())))
                .then();
    }

    public int updateExecute(QueryAllParams<T> params, BridgeUpdate update) {
        return updateExecute2(params, update);
    }

    public int updateExecute2(QueryAllParams<T> params, BridgeUpdate update) {
        Set<String> permissionGroupsSet = params.getPermissionGroups();
        List<String> permissionGroups;

        if (CollectionUtils.isEmpty(permissionGroupsSet)) {
            permissionGroups = new ArrayList<>(
                    getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(params.getPermission())));
        } else {
            permissionGroups = new ArrayList<>(permissionGroupsSet);
        }

        final EntityManager em = getEntityManager();

        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery<T> cq = cb.createQuery(genericDomain);
        final CriteriaUpdate<T> cu = cb.createCriteriaUpdate(genericDomain);
        final Root<T> root = cu.from(genericDomain);

        final List<Specification<T>> specifications = new ArrayList<>(params.getSpecifications());

        Predicate predicate = cb.and(
                Specification.allOf(specifications).toPredicate(root, cq, cb),
                root.get(FieldName.DELETED_AT).isNull());

        if (!permissionGroups.isEmpty()) {
            Map<String, String> fnVars = new HashMap<>();
            fnVars.put("p", params.getPermission().getValue());
            final List<String> conditions = new ArrayList<>();
            for (var i = 0; i < permissionGroups.size(); i++) {
                fnVars.put("g" + i, permissionGroups.get(i));
                conditions.add("@ == $g" + i);
            }

            try {
                predicate = cb.and(
                        predicate,
                        cb.isTrue(cb.function(
                                "jsonb_path_exists",
                                Boolean.class,
                                root.get(PermissionGroup.Fields.policies),
                                cb.literal("$[*] ? (@.permission == $p && exists(@.permissionGroups ? ("
                                        + String.join(" || ", conditions) + ")))"),
                                cb.literal(new ObjectMapper().writeValueAsString(fnVars)))));
            } catch (JsonProcessingException e) {
                // This should never happen, were serializing a Map<String, String>, which ideally should
                // never fail.
                throw new RuntimeException(e);
            }
        }

        cu.where(predicate);

        for (BridgeUpdate.SetOp op : update.getSetOps()) {
            Object key = op.key();
            Object value = op.value();

            if (key instanceof Path<?> keyPath) {
                key = fieldName(keyPath);
            }

            if (value instanceof Path<?> valuePath) {
                value = root.get(fieldName(valuePath));
                cu.set(root.get((String) key), value);

            } else if (value instanceof Collection<?> collection) {
                try {
                    // The type witness is needed here to pick the right overloaded signature of the set method.
                    // Without it, we see a compile error.
                    cu.<Object>set(
                            root.get((String) key),
                            cb.function(
                                    "json",
                                    Object.class,
                                    cb.literal(new ObjectMapper().writeValueAsString(collection))));
                } catch (JsonProcessingException e) {
                    throw new RuntimeException(e);
                }

            } else {
                cu.set(root.get((String) key), value);
            }
        }

        return em.createQuery(cu).executeUpdate();
    }

    public T setUserPermissionsInObject(T obj) {
        return setUserPermissionsInObject(obj, getCurrentUserPermissionGroups());
    }

    public T setUserPermissionsInObject(T obj, Collection<String> permissionGroups) {
        Set<String> permissions = new HashSet<>();
        obj.setUserPermissions(permissions);

        if (CollectionUtils.isEmpty(obj.getPolicies()) || permissionGroups.isEmpty()) {
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

        return obj;
    }

    /**
     * 1. Get all the user groups associated with the user
     * 2. Get all the permission groups associated with anonymous user
     * 3. Return the set of all the permission groups.
     */
    protected Set<String> getAllPermissionGroupsForUser(User user) {
        if (user.getTenantId() == null) {
            user.setTenantId(cacheableRepositoryHelper.getDefaultTenantId().block());
        }

        Set<String> permissionGroups = new HashSet<>(
                cacheableRepositoryHelper.getPermissionGroupsOfUser(user).block());
        permissionGroups.addAll(getAnonymousUserPermissionGroups().block());

        return permissionGroups;
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

    public List<T> queryAllWithoutPermissions(List<Criteria> criterias, List<String> includeFields) {
        return queryBuilder().criteria(criterias).fields(includeFields).all();
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
    public T updateAndReturn(String id, BridgeUpdate updateObj, Optional<AclPermission> permission) {
        return null; /*
                                  Query query = new Query(Criteria.where("id").is(id));

                                  FindAndModifyOptions findAndModifyOptions =
                                          FindAndModifyOptions.options().returnNew(Boolean.TRUE);

                                  if (permission.isEmpty()) {
                                      return mongoOperations.findAndModify(query, updateObj, findAndModifyOptions, this.genericDomain);
                                  }

                     return Mono.justOrEmpty(getCurrentUserPermissionGroupsIfRequired(permission)).flatMap(permissionGroups -> {
                         query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission.get())));
                         return mongoOperations.findAndModify(query, updateObj, findAndModifyOptions, this.genericDomain);
                     });//*/
    }

    public Optional<Void> bulkInsert(BaseRepository<T, String> baseRepository, List<T> entities) {
        if (CollectionUtils.isEmpty(entities)) {
            return Optional.empty();
        }

        // Ensure there's no duplicated ID. Only doing this because MongoDB version of this method had this protection.
        HashSet<String> seenIds = new HashSet<>();
        for (T entity : entities) {
            final String id = entity.getId();
            if (seenIds.contains(id)) {
                throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "id");
            }
            seenIds.add(id);
        }

        baseRepository.saveAll(entities);
        return Optional.empty();
    }

    public Optional<Void> bulkUpdate(BaseRepository<T, String> baseRepository, List<T> domainObjects) {
        if (CollectionUtils.isEmpty(domainObjects)) {
            return Optional.empty();
        }

        final Map<String, T> updatesById = new HashMap<>();
        domainObjects.forEach(e -> updatesById.put(e.getId(), e));

        final List<T> entitiesToSave = new ArrayList<>();
        baseRepository
                .findAllById(domainObjects.stream().map(BaseDomain::getId).toList())
                .forEach(entitiesToSave::add);

        for (final T e : entitiesToSave) {
            AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(updatesById.get(e.getId()), e);
        }

        baseRepository.saveAll(entitiesToSave);
        return Optional.empty();
    }
}
