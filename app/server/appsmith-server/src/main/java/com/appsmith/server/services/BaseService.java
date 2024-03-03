package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.cakes.BaseCake;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.repository.CrudRepository;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.helpers.ReactorUtils.asMonoDirect;
import static java.util.stream.Collectors.toSet;

@Slf4j
@RequiredArgsConstructor
public abstract class BaseService<
                R extends BaseRepository<T, ID> & AppsmithRepository<T>,
                C extends BaseCake<T, ? extends CrudRepository<T, String>>,
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
        return update(id, resource, "id");
    }

    public Mono<T> update(ID id, T resource, String key) {
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

        // TODO(Shri): update happens with `key=id` and find happens with `id=id` criteria. This is incorrect, but is
        //   too fragile to touch right now. Need to dig in slow and deep to fix this.
        return asMonoDirect(() -> repositoryDirect
                        .queryBuilder()
                        .criteria(Bridge.query().equal(key, (String) id))
                        .updateFirst(resource))
                .flatMap(obj -> repository.findById((String) id))
                .flatMap(savedResource ->
                        analyticsService.sendUpdateEvent(savedResource, getAnalyticsProperties(savedResource)));
    }

    protected Flux<T> getWithPermission(MultiValueMap<String, String> params, AclPermission aclPermission) {
        List<Criteria> criterias;

        if (params != null && !params.isEmpty()) {
            criterias = params.entrySet().stream()
                    .map(entry -> {
                        String key = entry.getKey();
                        List<String> values = entry.getValue();
                        return Criteria.where(key).in(values);
                    })
                    .collect(Collectors.toList());
        } else {
            criterias = new ArrayList<>();
        }

        return Mono.fromSupplier(() -> repositoryDirect
                        .queryBuilder()
                        .criteria(criterias)
                        .permission(aclPermission)
                        .all())
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }

    @Override
    public Flux<T> get(MultiValueMap<String, String> params) {
        // In the base service we aren't handling the query parameters. In order to filter records using the query
        // params,
        // each service must implement it for their usecase. Need to come up with a better strategy for doing this.
        return repository.findAll();
    }

    @Override
    public Mono<T> getById(ID id) {
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

    @Override
    public Mono<T> archiveById(ID id) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
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

    private Map<String, Set<Policy>> getAllPoliciesAsMap(Set<Policy> policies) {
        return policies.stream()
                .collect(
                        Collectors.groupingBy(Policy::getPermission, Collectors.mapping(Function.identity(), toSet())));
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
    public Flux<T> filterByEntityFields(
            List<String> searchableEntityFields,
            String searchString,
            Pageable pageable,
            Sort sort,
            AclPermission permission) {
        if (searchableEntityFields == null || searchableEntityFields.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ENTITY_FIELDS));
        }
        List<Criteria> criteriaList = searchableEntityFields.stream()
                .map(fieldName -> Criteria.where(fieldName).regex(".*" + Pattern.quote(searchString) + ".*", "i"))
                .toList();
        Criteria criteria = new Criteria().orOperator(criteriaList);
        Flux<T> result = Mono.fromSupplier(() -> repositoryDirect
                        .queryBuilder()
                        .criteria(criteria)
                        .permission(permission)
                        .sort(sort)
                        .all())
                .flatMapMany(Flux::fromIterable);
        if (pageable != null) {
            return result.skip(pageable.getOffset()).take(pageable.getPageSize());
        }
        return result;
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
        List<Criteria> criteriaList = searchableEntityFields.stream()
                .map(fieldName -> Criteria.where(fieldName).regex(".*" + Pattern.quote(searchString) + ".*", "i"))
                .toList();
        Criteria criteria = new Criteria().orOperator(criteriaList);

        Flux<T> result = Mono.fromSupplier(() -> repositoryDirect
                        .queryBuilder()
                        .criteria(criteria)
                        .permission(permission)
                        .sort(sort)
                        .includeAnonymousUserPermissions(false)
                        .all())
                .flatMapMany(Flux::fromIterable);
        if (pageable != null) {
            return result.skip(pageable.getOffset()).take(pageable.getPageSize());
        }
        return result;
    }
}
