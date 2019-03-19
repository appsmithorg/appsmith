package com.mobtools.server.services;

import com.mobtools.server.domains.Tenant;
import com.mobtools.server.repositories.TenantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
public class TenantServiceImpl extends BaseService<TenantRepository, Tenant, String> implements TenantService {

    private final TenantRepository repository;

    @Autowired
    public TenantServiceImpl(Scheduler scheduler,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             TenantRepository repository) {
        super(scheduler, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
    }

    @Override
    public Mono<Tenant> getByName(String name) {
        return repository.findByName(name);
    }
}
