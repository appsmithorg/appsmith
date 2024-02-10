package com.appsmith.server.services;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.cakes.BaseCake;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toSet;

@Slf4j
public abstract class BaseService<R extends BaseCake<T>, T extends BaseDomain, ID extends Serializable>
        implements CrudService<T, ID> {

    final Scheduler scheduler;

    protected final MongoConverter mongoConverter;

    protected final ReactiveMongoTemplate mongoTemplate;

    protected final R repository;

    protected final Validator validator;

    protected final AnalyticsService analyticsService;

    private static final String ENTITY_FIELDS = "entity_fields";

    public BaseService(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            R repository,
            AnalyticsService analyticsService) {
        this.scheduler = scheduler;
        this.validator = validator;
        this.mongoConverter = mongoConverter;
        this.mongoTemplate = reactiveMongoTemplate;
        this.repository = repository;
        this.analyticsService = analyticsService;
    }

    @Override
    public Mono<T> update(ID id, T resource) {
        return update(id, resource, "id");
    }

    public Mono<T> update(ID id, T resource, String key) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

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
    }

    protected Flux<T> getWithPermission(MultiValueMap<String, String> params, AclPermission aclPermission) {
        return Flux.error(new ex.Marker("getWithPermission")); /*
        List<Criteria> criterias = new ArrayList<>();

        if (params != null && !params.isEmpty()) {
            criterias = params.entrySet().stream()
                    .map(entry -> {
                        String key = entry.getKey();
                        List<String> values = entry.getValue();
                        return Criteria.where(key).in(values);
                    })
                    .collect(Collectors.toList());
        }
        return repository
                .queryBuilder()
                .criteria(criterias)
                .permission(aclPermission)
                .all();*/
    }

    @Override
    public Flux<T> get(MultiValueMap<String, String> params) {
        return Flux.error(new ex.Marker("get")); /*
        // In the base service we aren't handling the query parameters. In order to filter records using the query
        // params,
        // each service must implement it for their usecase. Need to come up with a better strategy for doing this.
        return repository.findAll();*/
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

    protected DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
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
        return null;
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
        return Flux.error(new ex.Marker("filterByEntityFields")); /*
        if (searchableEntityFields == null || searchableEntityFields.isEmpty()) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ENTITY_FIELDS));
        }
        List<Criteria> criteriaList = searchableEntityFields.stream()
                .map(fieldName -> Criteria.where(fieldName).regex(".*" + Pattern.quote(searchString) + ".*", "i"))
                .toList();
        Criteria criteria = new Criteria().orOperator(criteriaList);
        Flux<T> result = repository
                .queryBuilder()
                .criteria(criteria)
                .permission(permission)
                .sort(sort)
                .all();
        if (pageable != null) {
            return result.skip(pageable.getOffset()).take(pageable.getPageSize());
        }
        return result;*/
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
        return Flux.empty(); /*
        List<Criteria> criteriaList = searchableEntityFields.stream()
                .map(fieldName -> Criteria.where(fieldName).regex(".*" + Pattern.quote(searchString) + ".*", "i"))
                .toList();
        Criteria criteria = new Criteria().orOperator(criteriaList);

        Flux<T> result = repository.queryAllWithStrictPermissionGroups(
                List.of(criteria), Optional.empty(), Optional.ofNullable(permission), sort, -1, 0);
        if (pageable != null) {
            return result.skip(pageable.getOffset()).take(pageable.getPageSize());
        }
        return result;*/
    }
}
