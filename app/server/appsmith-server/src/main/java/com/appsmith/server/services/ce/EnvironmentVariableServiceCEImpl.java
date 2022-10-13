package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.repositories.EnvironmentVariableRepository;


import javax.validation.Validator;
import java.util.List;

@Slf4j
public class EnvironmentVariableServiceCEImpl extends BaseService<EnvironmentVariableRepository, EnvironmentVariable, String> implements EnvironmentVariableServiceCE {

    @Autowired
    public EnvironmentVariableServiceCEImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, EnvironmentVariableRepository repository, AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);

    }

    // read
    @Override
    public Mono<EnvironmentVariable> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }


    @Override
    public Flux<EnvironmentVariable> findAllByIds(List<String> ids, AclPermission aclPermission) {
        return repository.findAllByIds(ids, aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findByEnvironmentId(String envId, AclPermission aclPermission) {
        return repository.findByEnvironmentId(envId, aclPermission).filter(envVar -> !envVar.isDeleted());
    }

    @Override
    public Flux<EnvironmentVariable> findEnvironmentVariableByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        if (workspaceId == null) {
            return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        return repository.findByWorkspaceId(workspaceId, aclPermission)
                .switchIfEmpty(Flux.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND)));
    }

    // Write
    @Override
    public Mono<EnvironmentVariable> save(EnvironmentVariable envVariable) {
        return repository.save(envVariable);
    }

    @Override
    public Flux<EnvironmentVariable> saveAll(List<EnvironmentVariable> envVariables) {
        return repository.saveAll(envVariables);
    }

    // Delete/Archive

    @Override
    public Mono<EnvironmentVariable> archive(EnvironmentVariable envVariable) {
        return repository.archive(envVariable);
    }


    @Override
    public Mono<EnvironmentVariable> archiveById(String id) {
        Mono<EnvironmentVariable> environmentVariableMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ENVIRONMENT_VARIABLE, id)));

        // scope for analytics event to be added.
        return environmentVariableMono.map(environmentVariable -> {
            repository.archive(environmentVariable);
            return environmentVariable;
        });
    }

    // Update
    @Override
    public Mono<EnvironmentVariable> update(String id, EnvironmentVariable envVariable) {
        return super.update(id, envVariable);
    }

}
