package com.appsmith.server.repositories.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.ce.params.QueryAllParams;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Transient;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.CriteriaUpdate;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.transaction.Transactional;
import lombok.Getter;
import lombok.NonNull;
import lombok.SneakyThrows;
import org.hibernate.annotations.Type;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

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
 * <p>
 * Note, we use the {@code @Autowired} annotation for bean injection here, instead of using constructor injection. This
 * is an intentional exception to the usual recommendation. The reason is that this class is a base class for all other
 * repository classes, and using constructor params would require all repository classes to have the same constructor
 * params, and corresponding {@code super} calls. This was causing a lot of conflicts between CE and EE, and other
 * additional overhead, with very little value to speak for. Hence, we are using {@code @Autowired} here.
 * <p>
 * <a href="https://theappsmith.slack.com/archives/CPQNLFHTN/p1711966160274399">Ref Slack thread</a>.
 */
public abstract class BaseAppsmithRepositoryCEImpl<T extends BaseDomain> implements AppsmithRepository<T> {

    @Autowired
    @Getter
    private EntityManager entityManager;

    protected final Class<T> genericDomain;

    @Autowired
    private CacheableRepositoryHelper cacheableRepositoryHelper;

    public static final int NO_RECORD_LIMIT = -1;

    public static final int NO_SKIP = 0;

    @SuppressWarnings("unchecked")
    public BaseAppsmithRepositoryCEImpl() {
        this.genericDomain =
                (Class<T>) GenericTypeResolver.resolveTypeArgument(getClass(), BaseAppsmithRepositoryCEImpl.class);
    }

    public static <T extends BaseDomain> BridgeQuery<T> notDeleted() {
        return Bridge.isNull(FieldName.DELETED_AT);
    }

    @SneakyThrows
    protected Map<String, Object> getDbObject(Object o) {
        final Map<String, Object> map = new HashMap<>();
        Class<?> cls = o.getClass();
        while (!Object.class.equals(cls) && !BaseDomain.class.equals(cls)) {
            for (Field field : cls.getDeclaredFields()) {
                if (field.isAnnotationPresent(Transient.class)) {
                    continue;
                }
                field.setAccessible(true);
                final Object value = field.get(o);
                if (value != null) {
                    map.put(field.getName(), value);
                }
            }
            cls = cls.getSuperclass();
        }
        return map;
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

    /**
     * @deprecated This isn't as intuitive as with MongoDB, and isn't the best way with Hibernate. Just calling the
     * setter methods directly on the persistent object should serve better.
     */
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
                    // If the update flow is triggered within the server without any user context, then user object will
                    // be null
                    if (user != null) {
                        entityFromDB.setModifiedBy(user.getUsername());
                    }
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
        final BridgeQuery<BaseDomain> q = Bridge.equal(defaultIdPath, defaultId);

        if (!isBlank(branchName)) {
            q.equal(branchNamePath, branchName);
        }

        final BridgeUpdate update = Bridge.update();
        fieldNameValueMap.forEach(update::set);

        final int count = queryBuilder().criteria(q).permission(permission).updateFirst(update);
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

                    final List<Specification<T>> specifications = params.getSpecifications();
                    Predicate predicate = root.get(BaseDomain.Fields.deletedAt).isNull();

                    if (!specifications.isEmpty()) {
                        predicate = cb.and(Specification.allOf(specifications).toPredicate(root, cq, cb), predicate);
                    }

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

                    // TODO: Projection support
                    // cq.multiselect(params.getFields().stream().map(f -> (Selection<T>) root.<T>get(f)).toList());

                    // cq.orderBy(cb.desc(root.get(FieldName.CREATED_AT)));
                    if (params.getSort() != null) {
                        // TODO: untested
                        cq.orderBy(params.getSort()
                                .map(order -> {
                                    Expression<?> expression = root.get(order.getProperty());
                                    if (order.isIgnoreCase()) {
                                        // TODO: untested
                                        expression = cb.function("lower", String.class, expression);
                                    }
                                    return order.isAscending() ? cb.asc(expression) : cb.desc(expression);
                                })
                                .toList());
                    }

                    final TypedQuery<T> query = entityManager.createQuery(cq);

                    if (params.getLimit() > 0) {
                        query.setMaxResults(params.getLimit());
                    }

                    // All public access is via a single permission group. Fetch the same and set the cache with it.
                    return Mono.fromSupplier(query::getResultList)
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

    public Optional<T> queryFirstExecute(QueryAllParams<T> params) {
        params.limit(1);
        return queryOneExecute(params);
    }

    public Optional<Long> countExecute(QueryAllParams<T> params) {
        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.defer(() -> Mono.just(
                        getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(params.getPermission())))))
                .map(ArrayList::new)
                .flatMap(permissionGroups -> {
                    final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
                    final CriteriaQuery<Long> cq = cb.createQuery(Long.class);
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
                    cq.select(cb.count(root));

                    // All public access is via a single permission group. Fetch the same and set the cache with it.
                    return Mono.fromSupplier(entityManager.createQuery(cq)::getSingleResult)
                            .onErrorResume(NoResultException.class, e -> Mono.empty());
                })
                .blockOptional();
    }

    public int updateExecute(@NonNull QueryAllParams<T> params, @NonNull T resource) {
        final BridgeUpdate update = new BridgeUpdate();

        // In case the update is not used to update the policies, then set the policies to null to ensure that the
        // existing policies are not overwritten.
        if (resource.getPolicies().isEmpty()) {
            resource.setPolicies(null);
        }

        getDbObject(resource).forEach(update::set);
        return updateExecute(params, update);

        /*
        if (QueryAllParams.Scope.FIRST == params.getScope()) {
            final Optional<T> dbEntity = queryFirstExecute(params);
            if (dbEntity.isEmpty()) {
                return 0;
            }
            AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(resource, dbEntity.get());
            entityManager.persist(dbEntity);
            return 1;
        }

        throw new RuntimeException("Not implemented yet!"); //*/
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
            String key = op.key();
            Object value = op.value();

            if (op.isRawValue()) {
                if (isJsonColumn(genericDomain, key)) {
                    try {
                        // The type witness is needed here to pick the right overloaded signature of the set method.
                        // Without it, we see a compile error.
                        cu.<Object>set(
                                root.get(key),
                                cb.function(
                                        "json",
                                        Object.class,
                                        cb.literal(new ObjectMapper().writeValueAsString(value))));
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException(e);
                    }

                } else {
                    cu.set(root.get(key), value);
                }
            } else {
                // The type witness is necessary here to fix ambiguity regarding the method being called.
                cu.<Object>set(root.get(key), root.get((String) value));
            }
        }

        return em.createQuery(cu).executeUpdate();
    }

    private boolean isJsonColumn(Class<?> cls, String fieldName) {
        Field field = null;

        while (!Object.class.equals(cls)) {
            try {
                field = cls.getDeclaredField(fieldName);
                break;
            } catch (NoSuchFieldException e) {
                // Check the super class then.
                cls = cls.getSuperclass();
            }
        }

        if (field == null) {
            throw new RuntimeException("Field not found: " + fieldName);
        }

        if (!field.isAnnotationPresent(Type.class)) {
            return false;
        }

        return JsonBinaryType.class.equals(field.getAnnotation(Type.class).value())
                || CustomJsonType.class.equals(field.getAnnotation(Type.class).value());
    }

    /**
     * This method is needed, as opposed to letting services directly call `update*` methods on query builder, because
     * we need the `@Modifying` and the `@Transactional` annotations to be present on the method that actually does the
     * update operation. Not on a method that calls the update operation via `Mono.defer` or `asMono` etc. That doesn't
     * work.
     * That would hint that adding these annotations to the `updateExecute` method would solve the problem, but it also
     * doesn't. I don't know why yet, but this gets us across for now.
     */
    @Modifying
    @Transactional
    // @Override
    public int updateFirst(BridgeQuery<T> query, T resource) {
        return queryBuilder().criteria(query).updateFirst(resource);
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
     */
    public T updateAndReturn(String id, BridgeUpdate updateObj, Optional<AclPermission> permission) {
        throw new ex.Marker("updateAndReturn WIP");
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
