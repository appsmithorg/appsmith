package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.ce.params.QueryAllParams;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.WriteModel;
import lombok.NonNull;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ReflectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.lang.reflect.Modifier;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.StringUtils.dotted;
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
 * <p>
 * Note, we use the {@code @Autowired} annotation for bean injection here, instead of using constructor injection. This
 * is an intentional exception to the usual recommendation. The reason is that this class is a base class for all other
 * repository classes, and using constructor params would require all repository classes to have the same constructor
 * params, and corresponding {@code super} calls. This was causing a lot of conflicts between CE and EE, and other
 * additional overhead, with very little value to speak for. Hence, we are using {@code @Autowired} here.
 * <p>
 * <a href="https://theappsmith.slack.com/archives/CPQNLFHTN/p1711966160274399">Ref Slack thread</a>.
 */
public abstract class BaseAppsmithRepositoryCEImpl<T extends BaseDomain> {

    @Autowired
    private ReactiveMongoOperations mongoOperations;

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
        return Bridge.and(
                // Older check for deleted
                Bridge.or(Bridge.notExists(FieldName.DELETED), Bridge.isFalse(FieldName.DELETED)),
                // New check for deleted
                Bridge.isNull(FieldName.DELETED_AT));
    }

    public static Criteria userAcl(Set<String> permissionGroups, AclPermission permission) {
        if (permission == null) {
            return null;
        }
        // Check if the permission is being provided by any of the permission groups
        return Criteria.where(dotted(BaseDomain.Fields.policyMap, permission.getValue(), "permissionGroups"))
                .in(permissionGroups);
    }

    public Mono<T> findById(String id, AclPermission permission) {
        return queryBuilder().byId(id).permission(permission).one();
    }

    public Mono<T> updateById(@NonNull String id, @NonNull T resource, AclPermission permission) {
        // Set policies to null in the update object
        resource.setPolicies(null);

        final QueryAllParams<T> q = queryBuilder().byId(id).permission(permission);

        return q.updateFirst(buildUpdateFromSparseResource(resource)).then(Mono.defer(q::one));
    }

    public Mono<Integer> updateByIdWithoutPermissionCheck(@NonNull String id, BridgeUpdate update) {
        return queryBuilder().byId(id).updateFirst(update);
    }

    public Mono<Integer> updateFieldByBaseIdAndBranchName(
            String baseId,
            String baseIdPath,
            Map<String, Object> fieldNameValueMap,
            String branchName,
            String branchNamePath,
            AclPermission permission) {
        final QueryAllParams<T> builder = queryBuilder();

        builder.criteria(Criteria.where(baseIdPath).is(baseId));

        if (!isBlank(branchName)) {
            builder.criteria(Criteria.where(branchNamePath).is(branchName));
        }

        Update update = new Update();
        fieldNameValueMap.forEach(update::set);

        return builder.permission(permission).updateFirst(update);
    }

    public Mono<Integer> updateFieldById(
            String id, String idPath, Map<String, Object> fieldNameValueMap, AclPermission permission) {
        final QueryAllParams<T> builder = queryBuilder();

        builder.criteria(Criteria.where(idPath).is(id));

        Update update = new Update();
        fieldNameValueMap.forEach(update::set);

        return builder.permission(permission).updateFirst(update);
    }

    protected Mono<Set<String>> getCurrentUserPermissionGroupsIfRequired(AclPermission permission) {
        return getCurrentUserPermissionGroupsIfRequired(permission, true);
    }

    protected Mono<Set<String>> getCurrentUserPermissionGroupsIfRequired(
            AclPermission permission, boolean includeAnonymousUserPermissions) {
        return permission == null
                ? Mono.just(Set.of())
                : getCurrentUserPermissionGroups(includeAnonymousUserPermissions);
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
        return queryAllExecute(params, this.genericDomain)
                .flatMap(obj -> setUserPermissionsInObject(obj, params.getPermissionGroups()));
    }

    public <P> Flux<P> queryAllExecute(QueryAllParams<T> params, Class<P> projectionClass) {
        return ensurePermissionGroupsInParams(params).thenMany(Flux.defer(() -> {
            final AclPermission permission = params.getPermission();
            final Set<String> permissionGroups = params.getPermissionGroups();

            if (permission != null && CollectionUtils.isEmpty(permissionGroups)) {
                // There's a permission we want to check, but there's zero permission groups to check against. The
                // resulting query will _always_ be `false`. So returning an early response, without hitting the DB.
                return Flux.empty();
            }

            final Query query =
                    createQueryWithPermission(params.getCriteria(), params.getFields(), permissionGroups, permission);

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
                    .as(projectionClass)
                    .matching(query.cursorBatchSize(10_000))
                    .all();
        }));
    }

    public Mono<T> queryOneExecute(QueryAllParams<T> params) {
        return queryOneExecute(params, this.genericDomain)
                .flatMap(obj -> setUserPermissionsInObject(obj, params.getPermissionGroups()));
    }

    public <P> Mono<P> queryOneExecute(QueryAllParams<T> params, Class<P> projectionClass) {
        return ensurePermissionGroupsInParams(params).then(Mono.defer(() -> {
            final AclPermission permission = params.getPermission();
            final Set<String> permissionGroups = params.getPermissionGroups();

            if (permission != null && CollectionUtils.isEmpty(permissionGroups)) {
                // There's a permission we want to check, but there's zero permission groups to check against. The
                // resulting query will _always_ be `false`. So returning an early response, without hitting the DB.
                return Mono.empty();
            }

            final Query query =
                    createQueryWithPermission(params.getCriteria(), params.getFields(), permissionGroups, permission);

            return mongoOperations
                    .query(genericDomain)
                    .as(projectionClass)
                    .matching(query.cursorBatchSize(10_000))
                    .one();
        }));
    }

    public Mono<T> queryFirstExecute(QueryAllParams<T> params) {
        return ensurePermissionGroupsInParams(params).then(Mono.defer(() -> {
            final AclPermission permission = params.getPermission();
            final Set<String> permissionGroups = params.getPermissionGroups();

            if (permission != null && CollectionUtils.isEmpty(permissionGroups)) {
                // There's a permission we want to check, but there's zero permission groups to check against. The
                // resulting query will _always_ be `false`. So returning an early response, without hitting the DB.
                return Mono.empty();
            }

            final Query query =
                    createQueryWithPermission(params.getCriteria(), params.getFields(), permissionGroups, permission);

            return mongoOperations
                    .query(this.genericDomain)
                    .matching(query)
                    .first()
                    .flatMap(obj -> setUserPermissionsInObject(obj, permissionGroups));
        }));
    }

    public Mono<Long> countExecute(QueryAllParams<T> params) {
        return ensurePermissionGroupsInParams(params).then(Mono.defer(() -> {
            final AclPermission permission = params.getPermission();
            final Set<String> permissionGroups = params.getPermissionGroups();

            if (permission != null && CollectionUtils.isEmpty(permissionGroups)) {
                // There's a permission we want to check, but there's zero permission groups to check against. The
                // resulting query will _always_ be `false`. So returning an early response, without hitting the DB.
                return Mono.just(0L);
            }

            final Query query = createQueryWithPermission(params.getCriteria(), permissionGroups, permission);

            return mongoOperations.count(query, this.genericDomain);
        }));
    }

    public Mono<Integer> updateExecute(@NonNull QueryAllParams<T> params, @NonNull T resource) {
        return updateExecute(params, buildUpdateFromSparseResource(resource));
    }

    public Mono<Integer> updateExecute(@NonNull QueryAllParams<T> params, @NonNull UpdateDefinition update) {
        Objects.requireNonNull(params.getCriteria());

        if (!isEmpty(params.getFields())) {
            // Specifying fields to update doesn't make any sense, so explicitly disallow it.
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "fields"));
        }

        return ensurePermissionGroupsInParams(params).then(Mono.defer(() -> {
            final AclPermission permission = params.getPermission();
            final Set<String> permissionGroups = params.getPermissionGroups();

            if (permission != null && CollectionUtils.isEmpty(permissionGroups)) {
                // There's a permission we want to check, but there's zero permission groups to check against. The
                // resulting query will _always_ be `false`. So returning an early response, without hitting the DB.
                return Mono.just(0);
            }

            final Query query = createQueryWithPermission(params.getCriteria(), null, permissionGroups, permission);
            if (QueryAllParams.Scope.ALL.equals(params.getScope())) {
                return mongoOperations
                        .updateMulti(query, update, genericDomain)
                        .map(updateResult -> Math.toIntExact(updateResult.getMatchedCount()));
            } else if (QueryAllParams.Scope.FIRST.equals(params.getScope())) {
                return mongoOperations
                        .updateFirst(query, update, genericDomain)
                        .map(updateResult -> Math.toIntExact(updateResult.getMatchedCount()));
            } else {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "scope"));
            }
        }));
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
        if (params.getPermissionGroups() != null) {
            return Mono.empty();
        }

        return getCurrentUserPermissionGroupsIfRequired(
                        params.getPermission(), params.isIncludeAnonymousUserPermissions())
                .defaultIfEmpty(Collections.emptySet())
                .map(params::permissionGroups)
                .then();
    }

    public Mono<T> setUserPermissionsInObject(T obj) {
        return getCurrentUserPermissionGroups()
                .flatMap(permissionGroups -> setUserPermissionsInObject(obj, permissionGroups));
    }

    public Mono<T> setUserPermissionsInObject(T obj, Set<String> permissionGroups) {
        Set<String> permissions = new HashSet<>();
        obj.setUserPermissions(permissions);

        Set<Policy> existingPolicies = obj.getPolicies();
        final Set<Policy> policies = new HashSet<>(existingPolicies == null ? Set.of() : existingPolicies);
        if (CollectionUtils.isEmpty(policies) || permissionGroups.isEmpty()) {
            return Mono.just(obj);
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
        return Mono.just(obj);
    }

    /**
     * 1. Get all the user groups associated with the user
     * 2. Get all the permission groups associated with anonymous user
     * 3. Return the set of all the permission groups.
     */
    protected Mono<Set<String>> getAllPermissionGroupsForUser(User user) {

        Mono<User> userMono = Mono.just(user);
        if (user.getOrganizationId() == null) {
            userMono = cacheableRepositoryHelper.getCurrentUserOrganizationId().map(organizationId -> {
                user.setOrganizationId(organizationId);
                return user;
            });
        }

        return userMono.flatMap(userWithOrganization -> Mono.zip(
                        cacheableRepositoryHelper.getPermissionGroupsOfUser(userWithOrganization),
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
        if (user.getOrganizationId() == null) {
            userMono = cacheableRepositoryHelper.getCurrentUserOrganizationId().map(organizationId -> {
                user.setOrganizationId(organizationId);
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
     *
     * @see FindAndModifyOptions
     */
    public Mono<T> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        Query query = new Query(Criteria.where("id").is(id));

        FindAndModifyOptions findAndModifyOptions =
                FindAndModifyOptions.options().returnNew(Boolean.TRUE);

        if (permission == null) {
            return mongoOperations.findAndModify(query, updateObj, findAndModifyOptions, this.genericDomain);
        }

        return getCurrentUserPermissionGroupsIfRequired(permission, true).flatMap(permissionGroups -> {
            query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission)));
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
