package com.appsmith.server.repositories.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.helpers.JsonForDatabase;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.FieldInfo;
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
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.Transient;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.CriteriaUpdate;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Selection;
import jakarta.transaction.Transactional;
import lombok.Getter;
import lombok.NonNull;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.tuple.Pair;
import org.hibernate.annotations.Type;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ReflectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.external.helpers.ReflectionHelpers.getAllFields;
import static com.appsmith.server.constants.FieldName.PERMISSION_GROUPS;
import static com.appsmith.server.helpers.ce.ReflectionHelpers.extractFieldPaths;
import static com.appsmith.server.helpers.ce.ReflectionHelpers.map;
import static com.appsmith.server.helpers.ce.bridge.BridgeQuery.keyToExpression;

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
@Slf4j
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

    public Optional<T> findById(String id) {
        return queryBuilder().byId(id).one();
    }

    public Optional<T> findById(String id, AclPermission permission, User currentUser, EntityManager entityManager) {
        return queryBuilder()
                .byId(id)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .one();
    }

    public Optional<T> getById(String id, EntityManager entityManager) {
        return queryBuilder().byId(id).entityManager(entityManager).one();
    }

    @Transactional
    @Modifying
    public Optional<T> updateById(
            @NonNull String id, @NonNull T resource, AclPermission permission, User currentUser, EntityManager em) {
        // Set policies to null in the update object
        resource.setPolicies(null);

        final QueryAllParams<T> q =
                queryBuilder().byId(id).permission(permission, currentUser).entityManager(em);

        q.updateFirst(buildUpdateFromSparseResource(resource));

        try {
            // Detach the entity from the custom entity manager to avoid any side effects of the entity being managed.
            // With the custom entity manager which is being used for the transaction, the update op is not altering
            // the existing managed entity and hence the downstream still gets the non-updated entity. We need to
            // detach the existing entity first and fetch again to get the updated entity.
            //
            // e.g.
            // This doesn't work:
            // 1. Fetch entity with id=1
            // 2. Update entity with id=1
            // 3. Fetch entity with id=1 again
            // The entity fetched in step 3 will not have the updated values.
            //
            // This works:
            // 1. Fetch entity with id=1
            // 2. Update entity with id=1
            // 3. Detach entity fetched in step 1
            // 4. Fetch entity with id=1 again
            // The entity fetched in step 4 will have the updated values.
            if (em != entityManager && em != null) {
                // In case the entity is not managed by the entity manager we are making an extra DB call
                // TODO(Abhijeet): Detach the entity only if it is managed by the entity manager to avoid the extra DB
                //  call
                em.detach(q.one().orElse(null));
            }
        } catch (Exception e) {
            log.error("Exception during entity detach: ", e);
        }
        return q.one();
    }

    @Transactional
    @Modifying
    public int updateByIdWithoutPermissionCheck(@NonNull String id, BridgeUpdate update, EntityManager em) {
        return queryBuilder().byId(id).entityManager(em).updateFirst(update);
    }

    @Modifying
    @Transactional
    public Optional<Integer> updateFieldByBaseIdAndBranchName(
            String baseId,
            String baseIdPath,
            Map<String, Object> fieldNameValueMap,
            String branchName,
            String branchNamePath,
            AclPermission permission,
            User currentUser,
            EntityManager em) {
        final BridgeQuery<BaseDomain> q = Bridge.equal(baseIdPath, baseId);

        if (StringUtils.hasLength(branchName)) {
            q.equal(branchNamePath, branchName);
        }

        final BridgeUpdate update = Bridge.update();
        fieldNameValueMap.forEach(update::set);

        final int count = queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .entityManager(em)
                .updateFirst(update);
        return Optional.of(count);
    }

    @Transactional
    @Modifying
    public Optional<Integer> updateFieldById(
            String id,
            String idPath,
            Map<String, Object> fieldNameValueMap,
            AclPermission permission,
            User currentUser,
            EntityManager em) {
        final BridgeQuery<T> builder = Bridge.equal(idPath, id);
        BridgeUpdate update = new BridgeUpdate();
        fieldNameValueMap.forEach(update::set);

        final int count = queryBuilder()
                .criteria(builder)
                .permission(permission, currentUser)
                .entityManager(em)
                .updateFirst(update);
        return Optional.of(count);
    }

    protected Set<String> getCurrentUserPermissionGroupsIfRequired(
            AclPermission permission, User user, EntityManager em) {
        return getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(permission), user, true, em);
    }

    protected Set<String> getCurrentUserPermissionGroupsIfRequired(
            Optional<AclPermission> permission, User user, boolean includeAnonymousUserPermissions, EntityManager em) {
        // Expect a valid AclPermission and a user to fetch valid permission groups
        if (permission.isEmpty()) {
            return Set.of();
        }
        return getPermissionGroupsForUser(user, includeAnonymousUserPermissions, em);
    }

    public Set<String> getPermissionGroupsForUser(User user, EntityManager em) {
        return getPermissionGroupsForUser(user, true, em);
    }

    protected Set<String> getPermissionGroupsForUser(
            User user, boolean includeAnonymousUserPermissions, EntityManager em) {
        if (!isValidUser(user)) {
            return Set.of();
        }
        final Set<String> permissionGroups = includeAnonymousUserPermissions
                ? getAllPermissionGroupsForUser(user, em)
                : getStrictPermissionGroupsForUser(user, em);
        return permissionGroups == null ? Collections.emptySet() : permissionGroups;
    }

    public QueryAllParams<T> queryBuilder() {
        return new QueryAllParams<>(this);
    }

    public List<T> queryAllExecute(QueryAllParams<T> params) {
        ensurePermissionGroupsInParams(params).block();
        return queryAllExecute(params, genericDomain).stream()
                .map(obj -> setUserPermissionsInObject(obj, params.getPermissionGroups()))
                .toList();
    }

    @SneakyThrows
    @SuppressWarnings("unchecked")
    public <P> List<P> queryAllExecute(QueryAllParams<T> params, Class<P> projectionClass) {
        EntityManager em = getEntityManager(params);
        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.defer(() -> Mono.just(
                        getCurrentUserPermissionGroupsIfRequired(params.getPermission(), params.getUser(), em))))
                .map(ArrayList::new)
                .flatMap(permissionGroups -> {
                    if (params.getPermission() != null && permissionGroups.isEmpty()) {
                        return Mono.just(Collections.<P>emptyList());
                    }
                    final CriteriaBuilder cb = em.getCriteriaBuilder();
                    CriteriaQuery<?> cq = cb.createQuery(projectionClass);

                    // We are creating the query with generic return type as Object[] and then mapping it to the
                    // projection class using the constructor. This is required because Hibernate can't associate the
                    // non-premitive datatype with the correct type.
                    if (!projectionClass.getSimpleName().equals(genericDomain.getSimpleName())) {
                        cq = cb.createQuery(Object[].class);
                    }
                    final Root<T> root = cq.from(genericDomain);

                    final List<Specification<T>> specifications = params.getSpecifications();
                    Predicate predicate = root.get(BaseDomain.Fields.deletedAt).isNull();
                    if (!specifications.isEmpty()) {
                        predicate = cb.and(Specification.allOf(specifications).toPredicate(root, cq, cb), predicate);
                    }

                    final Predicate permissionGroupsPredicate =
                            getPermissionGroupsPredicate(permissionGroups, params.getPermission(), cb, root);
                    if (permissionGroupsPredicate != null) {
                        predicate = cb.and(predicate, permissionGroupsPredicate);
                    }

                    cq.where(predicate);

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

                    if (!projectionClass.getSimpleName().equals(genericDomain.getSimpleName())) {
                        List<Selection<?>> projectionFields = new ArrayList<>();
                        // Extract all field paths dynamically from the projection class
                        // Map of projection field path to the class type
                        List<FieldInfo> fieldPaths = extractFieldPaths(projectionClass);

                        for (FieldInfo fieldInfo : fieldPaths) {
                            projectionFields.add(keyToExpression(fieldInfo.type(), root, cb, fieldInfo.fullPath()));
                        }
                        cq.multiselect(projectionFields);
                    }

                    final TypedQuery<?> query = em.createQuery(cq);

                    if (params.getLimit() > 0) {
                        query.setMaxResults(params.getLimit());
                    }

                    return Mono.fromSupplier(query::getResultList)
                            .map(rows -> {
                                if (genericDomain.getSimpleName().equals(projectionClass.getSimpleName())) {
                                    return (List<P>) rows;
                                }
                                return map((List<Object[]>) rows, projectionClass);
                            })
                            .onErrorResume(NoResultException.class, e -> Mono.just(Collections.emptyList()));
                })
                .block();
    }

    public Optional<T> queryOneExecute(QueryAllParams<T> params) {
        ensurePermissionGroupsInParams(params).block();
        return queryOneExecute(params, genericDomain)
                .map(obj -> setUserPermissionsInObject(obj, params.getPermissionGroups()));
    }

    @SuppressWarnings("unchecked")
    public <P> Optional<P> queryOneExecute(QueryAllParams<T> params, Class<P> projectionClass) {
        EntityManager em = getEntityManager(params);
        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.defer(() -> Mono.just(
                        getCurrentUserPermissionGroupsIfRequired(params.getPermission(), params.getUser(), em))))
                .map(ArrayList::new)
                .flatMap(permissionGroups -> {
                    if (params.getPermission() != null && permissionGroups.isEmpty()) {
                        return Mono.empty();
                    }
                    final CriteriaBuilder cb = em.getCriteriaBuilder();
                    CriteriaQuery<?> cq = cb.createQuery(projectionClass);
                    // We are creating the query with generic return type as Object[] and then mapping it to the
                    // projection class using the constructor. This is required because Hibernate can't associate the
                    // non-premitive datatype with the correct type.
                    if (!projectionClass.getSimpleName().equals(genericDomain.getSimpleName())) {
                        cq = cb.createQuery(Object[].class);
                    }
                    final Root<T> root = cq.from(genericDomain);

                    final List<Specification<T>> specifications = new ArrayList<>(params.getSpecifications());

                    Predicate predicate = root.get(FieldName.DELETED_AT).isNull();
                    if (!specifications.isEmpty()) {
                        predicate = cb.and(Specification.allOf(specifications).toPredicate(root, cq, cb), predicate);
                    }

                    final Predicate permissionGroupsPredicate =
                            getPermissionGroupsPredicate(permissionGroups, params.getPermission(), cb, root);
                    if (permissionGroupsPredicate != null) {
                        predicate = cb.and(predicate, permissionGroupsPredicate);
                    }

                    cq.where(predicate);
                    if (!projectionClass.getSimpleName().equals(genericDomain.getSimpleName())) {
                        List<Selection<?>> projectionFields = new ArrayList<>();
                        getAllFields(projectionClass).forEach(f -> {
                            // TODO: Nested fields are not supported yet.
                            projectionFields.add(root.get(f.getName()));
                        });
                        cq.multiselect(projectionFields);
                    }

                    return Mono.fromSupplier(em.createQuery(cq)::getSingleResult)
                            .map(row -> {
                                if (genericDomain.getSimpleName().equals(projectionClass.getSimpleName())) {
                                    return (P) row;
                                }
                                return map((Object[]) row, projectionClass);
                            })
                            .onErrorResume(NoResultException.class, e -> Mono.empty());
                })
                .blockOptional();
    }

    public Optional<T> queryFirstExecute(QueryAllParams<T> params) {
        // TODO: We should mandate that `.sort` has been set in `params`.
        params.limit(1);
        final List<T> result = queryAllExecute(params);
        return result.isEmpty() ? Optional.empty() : Optional.of(result.get(0));
    }

    public Optional<Long> countExecute(QueryAllParams<T> params) {
        EntityManager em = getEntityManager(params);
        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.defer(() -> Mono.just(
                        getCurrentUserPermissionGroupsIfRequired(params.getPermission(), params.getUser(), em))))
                .map(ArrayList::new)
                .flatMap(permissionGroups -> {
                    if (params.getPermission() != null && permissionGroups.isEmpty()) {
                        return Mono.just(0L);
                    }
                    final CriteriaBuilder cb = em.getCriteriaBuilder();
                    final CriteriaQuery<Long> cq = cb.createQuery(Long.class);
                    final Root<T> root = cq.from(genericDomain);

                    final List<Specification<T>> specifications = new ArrayList<>(params.getSpecifications());

                    Predicate predicate = root.get(FieldName.DELETED_AT).isNull();

                    if (!specifications.isEmpty()) {
                        predicate = cb.and(Specification.allOf(specifications).toPredicate(root, cq, cb), predicate);
                    }

                    final Predicate permissionGroupsPredicate =
                            getPermissionGroupsPredicate(permissionGroups, params.getPermission(), cb, root);
                    if (permissionGroupsPredicate != null) {
                        predicate = cb.and(predicate, permissionGroupsPredicate);
                    }

                    cq.where(predicate);
                    cq.select(cb.count(root));

                    // All public access is via a single permission group. Fetch the same and set the cache with it.
                    return Mono.fromSupplier(em.createQuery(cq)::getSingleResult)
                            .onErrorResume(NoResultException.class, e -> Mono.empty());
                })
                .blockOptional();
    }

    @Transactional
    @Modifying
    public int updateExecute(@NonNull QueryAllParams<T> params, @NonNull T resource) {
        // In case the update is not used to update the policies, then set the policies to null to ensure that the
        // existing policies are not overwritten.
        if (resource.getPolicies().isEmpty()) {
            resource.setPolicies(null);
        }

        return updateExecute(params, buildUpdateFromSparseResource(resource));
    }

    public BridgeUpdate buildUpdateFromSparseResource(T resource) {
        // In case the update is not used to update the policies, then set the policies to null to ensure that the
        // existing policies are not overwritten.
        if (CollectionUtils.isEmpty(resource.getPolicies())) {
            resource.setPolicies(null);
        }

        final BridgeUpdate update = Bridge.update();

        ReflectionUtils.doWithFields(
                resource.getClass(),
                field -> {
                    if (field.isAnnotationPresent(Transient.class) || BaseDomain.Fields.id.equals(field.getName())) {
                        return;
                    }

                    final int modifiers = field.getModifiers();
                    if (Modifier.isStatic(modifiers) || Modifier.isFinal(modifiers)) {
                        return;
                    }

                    field.setAccessible(true);
                    final Object value = field.get(resource);
                    if (value != null) {
                        update.set(field.getName(), value);
                    }
                },
                null);

        return update.set(BaseDomain.Fields.updatedAt, Instant.now());
    }

    /**
     * This method will try to ensure that permission groups are present in the params. If they're already there, don't
     * do anything. If not, and if a `permission` is available, then get the permission groups for the current user and
     * permission and fill that into the `params` object.
     * @param params that may have permission groups already, and a permission that can be used to get permission groups otherwise.
     * @return the same `params` object, but with permission groups filled in.
     */
    private Mono<Void> ensurePermissionGroupsInParams(QueryAllParams<T> params) {
        if (!CollectionUtils.isEmpty(params.getPermissionGroups())) {
            return Mono.empty();
        }
        return Mono.justOrEmpty(params.getPermissionGroups())
                .switchIfEmpty(Mono.fromSupplier(() -> getCurrentUserPermissionGroupsIfRequired(
                        Optional.ofNullable(params.getPermission()),
                        params.getUser(),
                        params.isIncludeAnonymousUserPermissions(),
                        getEntityManager(params))))
                .doOnSuccess(params::permissionGroups)
                .then();
    }

    @Transactional
    @Modifying
    public int updateExecute(QueryAllParams<T> params, BridgeUpdate update) {
        Set<String> permissionGroupsSet = params.getPermissionGroups();
        ArrayList<String> permissionGroups;
        EntityManager em = getEntityManager(params);
        if (CollectionUtils.isEmpty(permissionGroupsSet)) {
            permissionGroups = new ArrayList<>(
                    getCurrentUserPermissionGroupsIfRequired(params.getPermission(), params.getUser(), em));
        } else {
            permissionGroups = new ArrayList<>(permissionGroupsSet);
        }

        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery<T> cq = cb.createQuery(genericDomain);
        final CriteriaUpdate<T> cu = cb.createCriteriaUpdate(genericDomain);
        final Root<T> root = cu.from(genericDomain);

        final List<Specification<T>> specifications = new ArrayList<>(params.getSpecifications());

        Predicate predicate = root.get(FieldName.DELETED_AT).isNull();
        if (!specifications.isEmpty()) {
            predicate = cb.and(Specification.allOf(specifications).toPredicate(root, cq, cb), predicate);
        }

        if (params.getPermission() != null && permissionGroups.isEmpty()) {
            return 0;
        }

        final Predicate permissionGroupsPredicate =
                getPermissionGroupsPredicate(permissionGroups, params.getPermission(), cb, root);
        if (permissionGroupsPredicate != null) {
            predicate = cb.and(predicate, permissionGroupsPredicate);
        }

        cu.where(predicate);

        // This piece of work is intended to handle multiple set operations on the same top-level field, but different
        // JSON-nested fields.
        // Example: Bridge.update().set("unpublishedAction.name", "new").set("unpublishedAction.something", "another");
        // This should end up with SQL fragment like:
        //   SET unpublished_action = jsonb_set(jsonb_set(unpublished_action, '{name}', 'new'), '{something}',
        // 'another')
        // And not:
        //   SET unpublished_action = jsonb_set(unpublished_action, '{something}', 'another') and unpublished_action =
        // jsonb_set(unpublished_action, '{name}', 'new')
        // Which is invalid SQL since we're setting the same column twice.
        // To solve this, we group these operations by the field name, and build that nested-looking `jsonb_set`
        // calls expression after we're done with all the `SetOp`s.
        // Not pretty, not simple, but hopefully will go away as we reduce our usage of nested JSON type columns.
        final Map<Path<Object>, List<Pair<Expression<String>, Expression<String>>>> nestedFieldModifications =
                new LinkedHashMap<>();

        for (BridgeUpdate.SetOp op : update.getSetOps().values()) {
            String key = op.key();
            Object value = op.value();

            if (op.isRawValue()) {
                if (key.contains(".")) {
                    // Updating a nested field in a JSONB column.
                    final String[] parts = key.split("\\.", 2);
                    final Path<Object> field = root.get(parts[0]);

                    // The nested field path should be a Postgres-array with strings in it. We should probably be using
                    // `cb.array()` here, but couldn't get that to work.
                    final Expression<String> path = cb.literal("{" + String.join(",", parts[1].split("\\.")) + "}");

                    try {
                        if (!nestedFieldModifications.containsKey(field)) {
                            nestedFieldModifications.put(field, new ArrayList<>());
                        }
                        nestedFieldModifications
                                .get(field)
                                .add(Pair.of(path, cb.literal(JsonForDatabase.writeValueAsString(value))));
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException(e);
                    }

                } else if (isJsonColumn(genericDomain, key)) {

                    try {
                        // The type witness is needed here to pick the right overloaded signature of the set method.
                        // Without it, we see a compile error.
                        cu.<Object>set(
                                root.get(key),
                                cb.function(
                                        "json", Object.class, cb.literal(JsonForDatabase.writeValueAsString(value))));
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

        for (Map.Entry<Path<Object>, List<Pair<Expression<String>, Expression<String>>>> entry :
                nestedFieldModifications.entrySet()) {
            final Path<Object> field = entry.getKey();
            // If the existing field value is `null`, the `jsonb_set` function doesn't do anything and just returns
            // `null`. So we have to "coalesce" it with an empty object, `{}`, which is the MongoDB behavior.
            // This is documented behaviour in `jsonb_set`, of course!
            // TODO(Shri): This still doesn't work for nested missing fields, also as documented. Solve when needed.
            Expression<Object> finalExpression = cb.coalesce(field, cb.literal("{}"));
            for (Pair<Expression<String>, Expression<String>> pair : entry.getValue()) {
                finalExpression =
                        cb.function("jsonb_set", Object.class, finalExpression, pair.getLeft(), pair.getRight());
            }
            cu.<Object>set(field, finalExpression);
        }

        return em.createQuery(cu).executeUpdate();
    }

    private boolean isJsonColumn(Class<?> cls, String fieldName) {
        Field field = null;

        // If the field is nested, then check if the first part of the field is a json column.
        if (fieldName.contains(".")) {
            fieldName = fieldName.split("\\.")[0];
        }
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
    public int updateFirst(BridgeQuery<T> query, T resource, EntityManager entityManager) {
        return queryBuilder().entityManager(entityManager).criteria(query).updateFirst(resource);
    }

    public T setUserPermissionsInObject(T obj, User user, EntityManager em) {
        Set<String> permissionGroups = new HashSet<>();
        if (isValidUser(user)) {
            permissionGroups = getPermissionGroupsForUser(user, em);
        }
        return setUserPermissionsInObject(obj, permissionGroups);
    }

    public T setUserPermissionsInObject(T obj, Collection<String> permissionGroups) {
        Set<String> permissions = new HashSet<>();
        obj.setUserPermissions(permissions);

        Set<Policy> existingPolicies = obj.getPolicies();
        final Set<Policy> policies = new HashSet<>(existingPolicies == null ? Set.of() : existingPolicies);
        if (CollectionUtils.isEmpty(policies) || permissionGroups.isEmpty()) {
            return obj;
        }

        for (Policy policy : policies) {
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
        obj.setPolicies(policies);
        return obj;
    }

    /**
     * 1. Get all the user groups associated with the user
     * 2. Get all the permission groups associated with anonymous user
     * 3. Return the set of all the permission groups.
     */
    protected Set<String> getAllPermissionGroupsForUser(User user, EntityManager em) {
        if (!isValidUser(user)) {
            return Collections.emptySet();
        } else if (user.getTenantId() == null) {
            user.setTenantId(cacheableRepositoryHelper.getDefaultTenantId().block());
        }

        Set<String> permissionGroups = new HashSet<>(
                cacheableRepositoryHelper.getPermissionGroupsOfUser(user, em).block());
        permissionGroups.addAll(getAnonymousUserPermissionGroups().block());

        return permissionGroups;
    }

    /**
     * 1. Get all the user groups associated with the user
     * 2. Get all the permission groups associated with anonymous user
     * 3. Return the set of all the permission groups.
     */
    protected Set<String> getStrictPermissionGroupsForUser(User user, EntityManager em) {

        if (!isValidUser(user)) {
            return Collections.emptySet();
        } else if (user.getTenantId() == null) {
            String tenantId = cacheableRepositoryHelper.getDefaultTenantId().block();
            user.setTenantId(tenantId);
        }
        return cacheableRepositoryHelper.getPermissionGroupsOfUser(user, em).block();
    }

    protected Mono<Set<String>> getAnonymousUserPermissionGroups() {
        return cacheableRepositoryHelper.getPermissionGroupsOfAnonymousUser();
    }

    private static Predicate getPermissionGroupsPredicate(
            ArrayList<String> permissionGroups,
            AclPermission permission,
            CriteriaBuilder cb,
            Root<? extends BaseDomain> root) {
        if (permission == null) {
            return null;
        }

        return cb.isTrue(cb.function(
                "jsonb_exists_any",
                Boolean.class,
                cb.function(
                        "jsonb_extract_path",
                        String.class,
                        root.get(BaseDomain.Fields.policyMap),
                        cb.literal(permission.getValue()),
                        cb.literal(PERMISSION_GROUPS)),
                cb.literal(permissionGroups.toArray(new String[0]))));
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
     * TODO check if this can be implemented with single DB call
     */
    @Transactional
    @Modifying
    public T updateAndReturn(
            String id, BridgeUpdate updateObj, AclPermission permission, User currentUser, EntityManager em) {
        int modifiedCount = queryBuilder()
                .byId(id)
                .permission(permission, currentUser)
                .entityManager(em)
                .updateFirst(updateObj);
        return queryBuilder()
                .byId(id)
                .permission(permission, currentUser)
                .entityManager(em)
                .one()
                .orElse(null);
    }

    @Transactional
    @Modifying
    public Optional<Void> bulkInsert(BaseRepository<T, String> baseRepository, List<T> entities, EntityManager em) {
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

        entities.forEach(em::persist);
        return Optional.empty();
    }

    @Transactional
    @Modifying
    public Optional<Void> bulkUpdate(
            BaseRepository<T, String> baseRepository, List<T> domainObjects, EntityManager em) {
        if (CollectionUtils.isEmpty(domainObjects)) {
            return Optional.empty();
        }
        Class<?> domainClass = domainObjects.get(0).getClass();

        final Map<String, T> updatesById = new HashMap<>();
        domainObjects.forEach(e -> updatesById.put(e.getId(), e));

        BridgeQuery<?> query =
                Bridge.in(BaseDomain.Fields.id, updatesById.keySet()).isNull(BaseDomain.Fields.deletedAt);

        final List<T> entitiesToSave =
                queryBuilder().criteria(query).entityManager(entityManager).all();

        for (final T e : entitiesToSave) {
            AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(updatesById.get(e.getId()), e);
        }

        entitiesToSave.forEach(em::persist);
        return Optional.empty();
    }

    private static boolean isValidUser(User user) {
        return user != null
                && StringUtils.hasLength(user.getEmail())
                && (user.isAnonymous() || StringUtils.hasLength(user.getId()));
    }

    private EntityManager getEntityManager(QueryAllParams<T> params) {
        return params.getEntityManager() == null ? entityManager : params.getEntityManager();
    }
}
