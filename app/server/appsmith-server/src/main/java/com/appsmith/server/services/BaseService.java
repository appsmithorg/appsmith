package com.appsmith.server.services;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.AppsmithRepository;
import com.appsmith.server.repositories.BaseRepository;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toSet;

@Slf4j
public abstract class BaseService<R extends BaseRepository<T, ID> & AppsmithRepository<T>, T extends BaseDomain, ID extends Serializable>
        implements CrudService<T, ID> {

    final Scheduler scheduler;

    protected final MongoConverter mongoConverter;

    protected final ReactiveMongoTemplate mongoTemplate;

    protected final R repository;

    protected final Validator validator;

    protected final AnalyticsService analyticsService;

    public BaseService(Scheduler scheduler,
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

        Query query = new Query(Criteria.where(key).is(id));

        // In case the update is not used to update the policies, then set the policies to null to ensure that the
        // existing policies are not overwritten.
        if (resource.getPolicies().isEmpty()) {
            resource.setPolicies(null);
        }

        DBObject update = getDbObject(resource);

        Update updateObj = new Update();
        Map<String, Object> updateMap = update.toMap();
        updateMap.entrySet().stream().forEach(entry -> updateObj.set(entry.getKey(), entry.getValue()));

        return mongoTemplate.updateFirst(query, updateObj, resource.getClass())
                .flatMap(obj -> repository.findById(id))
                .flatMap(analyticsService::sendUpdateEvent);
    }

    protected Flux<T> getWithPermission(MultiValueMap<String, String> params, AclPermission aclPermission) {
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
        return repository.queryAll(criterias, aclPermission);
    }

    @Override
    public Flux<T> get(MultiValueMap<String, String> params) {
        // In the base service we aren't handling the query parameters. In order to filter records using the query params,
        // each service must implement it for their usecase. Need to come up with a better strategy for doing this.
        return repository.findAll();
    }

    @Override
    public Mono<T> getById(ID id) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "resource", id)));
    }

    @Override
    public Mono<T> create(T object) {
        return Mono.just(object)
                .flatMap(this::validateObject)
                .flatMap(repository::save)
                .flatMap(analyticsService::sendCreateEvent);
    }

    protected DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
    }

    @Override
    public Mono<T> delete(ID id) {
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
        return Mono.just(obj)
                .map(validator::validate)
                .flatMap(constraint -> {
                    if (constraint.isEmpty()) {
                        return Mono.just(obj);
                    }
                    return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, constraint.stream().findFirst().get().getPropertyPath()));
                });
    }


    /**
     * This function appends new policies to an object.
     * This should be used in updating organization/application permissions to cascade the same permissions across all
     * the objects lying below in the hierarchy
     * @param id : Object Id
     * @param policies : Policies that have to be appended to the object
     * @return Object which has been updated with the new policies.
     */
    @Override
    public Mono<T> addPolicies(ID id, Set<Policy> policies) {
        Map<String, Set<Policy>> policyMap = getAllPoliciesAsMap(policies);

        return getById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "object", id)))
                .flatMap(obj -> {
                    // Append the user to the existing permission policy if it already exists.
                    for (Policy policy : obj.getPolicies()) {
                        String permission = policy.getPermission();
                        if (policyMap.containsKey(permission)) {
                            for (Policy newPolicy : policyMap.get(permission)) {
                                policy.getUsers().addAll(newPolicy.getUsers());

                                if (newPolicy.getGroups() != null) {
                                    if (policy.getGroups() == null) {
                                        policy.setGroups(new HashSet<>());
                                    }
                                    policy.getGroups().addAll(newPolicy.getGroups());
                                }
                            }
                            // Remove this permission from the policyMap as this has been accounted for in the above code
                            policyMap.remove(permission);
                        }
                    }

                    // For all the remaining policies which exist in the policyMap but didnt exist in the object
                    // earlier, just add them to the set
                    Iterator<String> iterator = policyMap.keySet().iterator();
                    while(iterator.hasNext()) {
                        String permission = iterator.next();
                        Set<Policy> policySet = policyMap.get(permission);
                        obj.getPolicies().addAll(policySet);
                    }

                    return repository.save(obj);
                });
    }

    /**
     * This function removes existing policies from an object.
     * This should be used in updating organization/application permissions to cascade the same permissions across all
     * the objects lying below in the hierarchy
     * @param id : Object Id
     * @param policies : Policies that have to be removed from the object
     * @return Object which has been updated with the removal of policies.
     */
    @Override
    public Mono<T> removePolicies(ID id, Set<Policy> policies) {
        Map<String, Set<Policy>> policyMap = getAllPoliciesAsMap(policies);

        return getById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "object", id)))
                .flatMap(obj -> {
                    // Remove the user from the existing permission policy if it exists.
                    for (Policy policy : obj.getPolicies()) {
                        String permission = policy.getPermission();
                        if (policyMap.containsKey(permission)) {
                            for (Policy newPolicy : policyMap.get(permission)) {
                                Set<String> usersInObjectPolicy = policy.getUsers();
                                usersInObjectPolicy.removeAll(newPolicy.getUsers());
                                policy.setUsers(usersInObjectPolicy);

                                if (newPolicy.getGroups() != null && policy.getGroups() != null) {
                                    Set<String> groupsInObjectPolicy = policy.getGroups();
                                    groupsInObjectPolicy.removeAll(newPolicy.getGroups());
                                }
                            }
                            // Remove this permission from the policyMap as this has been accounted for in the above code
                            policyMap.remove(permission);
                        }
                    }

                    // For all the remaining policies which exist in the policyMap but didnt exist in the object
                    // earlier, we dont need to remove it. Save and return.

                    return repository.save(obj);
                });
    }

    private Map<String, Set<Policy>> getAllPoliciesAsMap(Set<Policy> policies) {
        return policies
                .stream()
                .collect(Collectors.groupingBy(Policy::getPermission,
                        Collectors.mapping(Function.identity(), toSet())));
    }
}
