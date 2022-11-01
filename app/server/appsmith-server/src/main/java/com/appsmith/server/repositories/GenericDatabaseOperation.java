package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.helpers.CollectionUtils;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class GenericDatabaseOperation {

    protected final ReactiveMongoOperations mongoOperations;

    public GenericDatabaseOperation(ReactiveMongoOperations mongoOperations) {
        this.mongoOperations = mongoOperations;
    }

    public Mono<Long> updatePolicies(String objectId, String permissionGroupId, List<AclPermission> added, List<AclPermission> removed, Class clazz) {

        Query readQuery = new Query();
        readQuery.addCriteria(where("id").is(objectId));
        return mongoOperations.findOne(readQuery, clazz)
                .flatMap(result -> {
                    BaseDomain obj = (BaseDomain) result;
                    Set<Policy> policies = obj.getPolicies();
                    if (!CollectionUtils.isNullOrEmpty(added)) {
                        added.stream()
                                .forEach(aclPermission -> {
                                    Optional<Policy> interestedPolicyOptional = policies.stream().filter(policy -> policy.getPermission().equals(aclPermission.getValue()))
                                            .findFirst();

                                    if (interestedPolicyOptional.isPresent()) {
                                        interestedPolicyOptional.get().getPermissionGroups().add(permissionGroupId);
                                    } else {
                                        Policy policy = Policy.builder()
                                                .permission(aclPermission.getValue())
                                                .permissionGroups(Set.of(permissionGroupId))
                                                .build();

                                        policies.add(policy);
                                    }
                                });
                    }

                    if (!CollectionUtils.isNullOrEmpty(removed)) {
                        removed.stream()
                                .forEach(aclPermission -> {
                                    Optional<Policy> interestedPolicyOptional = policies.stream().filter(policy -> policy.getPermission().equals(aclPermission.getValue()))
                                            .findFirst();

                                    if (interestedPolicyOptional.isPresent()) {
                                        interestedPolicyOptional.get().getPermissionGroups().remove(permissionGroupId);
                                    }
                                    // Nothing to do if the permission itself isn't present.
                                });
                    }

                    obj.setPolicies(policies);
                    return mongoOperations.save(obj)
                            .thenReturn(1L);
                });

        // TODO : Make the atomic update working instead of reading the document, and then manually updating the policies.

//        if (added.size() > 0) {
//            Query query = new Query();
//            query.addCriteria(where("id").is(objectId));
//
//            Update update = new Update();
//
//            Set<Criteria> criteriaList = new HashSet<>();
//
//            added.stream()
//                    .forEach(aclPermission -> {
//                        String permission = aclPermission.getValue();
//                        Criteria criteria1 = where("policies").elemMatch(where("permission").is(permission));
//                        criteriaList.add(criteria1);
//                    });
//
//            query.addCriteria(new Criteria().orOperator(criteriaList));
//
//            update.addToSet("policies.$.permissionGroups", permissionGroupId);
//
//            return mongoOperations.updateMulti(query, update, clazz)
//                    .map(result -> result.getModifiedCount());
//        }
//
//        if (removed.size() > 0) {
//            Query query = new Query();
//            query.addCriteria(where("id").is(objectId));
//
//            Update update = new Update();
//
//            Set<String> permissionsRemoved = removed.stream()
//                    .map(aclPermission -> aclPermission.getValue())
//                    .collect(Collectors.toSet());
//
//            query.addCriteria(
//                    Criteria.where("policies").elemMatch(Criteria.where("permission").in(permissionsRemoved))
//            );
//
//            update.pull("policies.$.permissionGroups", permissionGroupId);
//
//            return mongoOperations.updateFirst(query, update, clazz)
//                    .map(result -> result.getModifiedCount());
//        }
//
//        return Mono.just(0L);
    }
}
