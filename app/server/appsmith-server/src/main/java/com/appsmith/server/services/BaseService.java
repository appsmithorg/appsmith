package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.cakes.BaseCake;
import jakarta.persistence.EntityManager;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.TX_CONTEXT;
import static com.appsmith.server.helpers.ReactorUtils.asFlux;

@Slf4j
@RequiredArgsConstructor
public abstract class BaseService<
                R extends BaseRepository<T, ID> & AppsmithRepository<T>,
                C extends BaseCake<T, ? extends BaseRepository<T, String>>,
                T extends BaseDomain,
                ID extends Serializable>
        implements CrudService<T, ID> {

    protected final Validator validator;

    protected final R repositoryDirect;

    protected final C repository;

    protected final AnalyticsService analyticsService;

    private static final String ENTITY_FIELDS = "entity_fields";

    @Override
    public Mono<T> update(ID id, T resource) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        /* Original Pg-only implementation:
        // In case the update is not used to update the policies, then set the policies to null to ensure that the
        // existing policies are not overwritten.
        if (CollectionUtils.isNullOrEmpty(resource.getPolicies())) {
            resource.setPolicies(null);
        }

        return repository
                .findOne((root, query, builder) -> builder.equal(root.get(key), id))
                .flatMap(dbResource -> {
                    AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(resource, dbResource);
                    dbResource.setUpdatedAt(Instant.now());
                    return repository.save(dbResource);
                });
        */

        resource.setUpdatedAt(Instant.now());

        return repository
                .updateById((String) id, resource, null)
                .flatMap(obj -> repository.findById((String) id))
                .flatMap(savedResource ->
                        analyticsService.sendUpdateEvent(savedResource, getAnalyticsProperties(savedResource)));
    }

    @Override
    public Mono<T> getByIdWithoutPermissionCheck(ID id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository
                .findById((String) id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", id)));
    }

    @Override
    public Mono<T> create(T object) {
        return validateObject(object)
                .flatMap(repository::save)
                .flatMap(savedResource ->
                        analyticsService.sendCreateEvent(savedResource, getAnalyticsProperties(savedResource)));
    }

    /**
     * This function runs the validation checks on the object and returns a Mono.error if any of the constraints
     * have been violated. If all checks pass, a Mono of the object is returned back to the caller
     *
     * @param obj
     * @return Mono<T>
     */
    protected Mono<T> validateObject(T obj) {
        return Mono.just(obj).map(validator::validate).flatMap(constraint -> {
            if (constraint.isEmpty()) {
                return Mono.just(obj);
            }
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_PARAMETER,
                    constraint.stream().findFirst().get().getPropertyPath()));
        });
    }

    @Override
    public Map<String, Object> getAnalyticsProperties(T savedResource) {
        return new HashMap<>();
    }

    /**
     * This function is used to filter the entities based on the entity fields and the search string.
     * The search is performed with contains operator on the entity fields and is case-insensitive.
     * @param searchableEntityFields  The list of entity fields to search for. If null or empty, all entities are searched.
     * @param searchString  The string to search for in the entity fields.
     * @param pageable      The page number of the results to return.
     * @param sort          The sort order of the results to return.
     * @param permission    The permission to check for the entity.
     * @return  A Flux of entities.
     */
    public Flux<T> filterByEntityFieldsWithoutPublicAccess(
            List<String> searchableEntityFields,
            String searchString,
            Pageable pageable,
            Sort sort,
            AclPermission permission) {

        if (searchableEntityFields == null || searchableEntityFields.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ENTITY_FIELDS));
        }

        List<BridgeQuery<T>> criteria = new ArrayList<>();
        for (String fieldName : searchableEntityFields) {
            criteria.add(Bridge.searchIgnoreCase(fieldName, searchString));
        }

        Flux<T> result = ReactiveContextUtils.getCurrentUser()
                .zipWith(Mono.deferContextual(
                        ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, (EntityManager) repository.getEntityManager()))))
                .flatMapMany(tuple2 -> asFlux(() -> repositoryDirect
                        .queryBuilder()
                        .criteria(Bridge.or(criteria))
                        .permission(permission, tuple2.getT1())
                        .sort(sort)
                        .includeAnonymousUserPermissions(false)
                        .entityManager(tuple2.getT2())
                        .all()))
                .publishOn(Schedulers.single());
        if (pageable != null) {
            return result.skip(pageable.getOffset()).take(pageable.getPageSize());
        }
        return result;
    }
}
