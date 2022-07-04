package com.appsmith.server.services.ce;

import com.appsmith.server.domains.RbacPolicy;
import com.appsmith.server.repositories.RbacPolicyRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.HashSet;
import java.util.Set;

public class RbacPolicyServiceCEImpl extends BaseService<RbacPolicyRepository, RbacPolicy, String> implements RbacPolicyServiceCE{

    public RbacPolicyServiceCEImpl(Scheduler scheduler,
                                   Validator validator,
                                   MongoConverter mongoConverter,
                                   ReactiveMongoTemplate reactiveMongoTemplate,
                                   RbacPolicyRepository repository,
                                   AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Mono<RbacPolicy> create(RbacPolicy policy) {
        String userId = policy.getUserId();
        if (StringUtils.hasLength(userId)) {

            return repository.findByUserId(userId)
                    // if a policy for the uesr already exists, add the new permission groups to the policy instead
                    // of creating a new one.
                    .map(rbacPolicy -> {
                        Set<String> permissionGroupIds = rbacPolicy.getPermissionGroupIds();
                        if (permissionGroupIds == null) {
                            permissionGroupIds = new HashSet<>();
                        }
                        permissionGroupIds.addAll(policy.getPermissionGroupIds());
                        return rbacPolicy;
                    })
                    // If the policy with this userId does not exist, then validate the same before it gets saved.
                    .switchIfEmpty(
                            Mono.just(policy)
                                    .flatMap(newPolicy -> super.validateObject(newPolicy))
                    )
                    .flatMap(repository::save);
        } else {
            return super.create(policy);
        }
    }
}
