package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public abstract class BaseService<
                R extends BaseRepository<T, ID> & AppsmithRepository<T>, T extends BaseDomain, ID extends Serializable>
        implements CrudService<T, ID> {

    protected final Validator validator;

    protected final R repository;

    protected final AnalyticsService analyticsService;

    private static final String ENTITY_FIELDS = "entity_fields";

    @Override
    public Mono<T> update(ID id, T resource) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        resource.setUpdatedAt(Instant.now());

        return repository
                .queryBuilder()
                .byId((String) id)
                .updateFirst(resource)
                .flatMap(obj -> repository.findById(id))
                .flatMap(savedResource ->
                        analyticsService.sendUpdateEvent(savedResource, getAnalyticsProperties(savedResource)));
    }

    @Override
    public Mono<T> getByIdWithoutPermissionCheck(ID id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository
                .findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", id)));
    }

    @Override
    public Mono<T> create(T object) {
        return Mono.just(object)
                .flatMap(this::validateObject)
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

        Flux<T> result = repository
                .queryBuilder()
                .criteria(Bridge.or(criteria))
                .permission(permission)
                .sort(sort)
                .includeAnonymousUserPermissions(false)
                .all();
        if (pageable != null) {
            return result.skip(pageable.getOffset()).take(pageable.getPageSize());
        }
        return result;
    }
}
