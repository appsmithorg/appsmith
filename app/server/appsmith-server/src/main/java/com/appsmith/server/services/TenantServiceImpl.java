package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ce.TenantServiceCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class TenantServiceImpl extends TenantServiceCEImpl implements TenantService{
    public TenantServiceImpl(Scheduler scheduler, 
                             Validator validator, 
                             MongoConverter mongoConverter, 
                             ReactiveMongoTemplate reactiveMongoTemplate, 
                             TenantRepository repository, 
                             AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

    @Override
    public Mono<Tenant> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<Tenant> save(Tenant tenant) {
        return repository.save(tenant);
    }

    @Override
    public Mono<Tenant> getDefaultTenant() {
        return this.getDefaultTenantId()
                .flatMap(id -> repository.retrieveById(id));
    }
}
