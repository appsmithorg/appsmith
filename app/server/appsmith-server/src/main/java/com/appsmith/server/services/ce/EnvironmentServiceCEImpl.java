package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.services.EnvironmentVariableService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;
import com.appsmith.server.repositories.EnvironmentRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;


import javax.validation.Validator;

@Slf4j
public class EnvironmentServiceCEImpl extends BaseService<EnvironmentRepository, Environment, String> implements EnvironmentServiceCE {

    private final EnvironmentRepository repository;

    @Autowired
    public EnvironmentServiceCEImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, EnvironmentRepository repository, AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
    }

    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        if (workspaceId == null) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER));
        }

        return repository.findByWorkspaceId(workspaceId, aclPermission).switchIfEmpty(Flux.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND)));
    }

    @Override
    public Mono<Environment> findById(String id, AclPermission aclPermission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        return repository.findById(id, aclPermission).switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND)));
    }




}
