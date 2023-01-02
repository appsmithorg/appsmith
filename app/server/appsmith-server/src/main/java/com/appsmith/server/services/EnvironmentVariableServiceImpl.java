package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.EnvironmentVariableRepository;
import com.appsmith.server.services.ce.EnvironmentVariableServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import jakarta.validation.Validator;
import java.util.List;

@Slf4j
@Service
public class EnvironmentVariableServiceImpl extends EnvironmentVariableServiceCEImpl
        implements EnvironmentVariableService {

    @Autowired
    public EnvironmentVariableServiceImpl(Scheduler scheduler,
                                            Validator validator,
                                            MongoConverter mongoConverter,
                                            ReactiveMongoTemplate reactiveMongoTemplate,
                                            EnvironmentVariableRepository repository,
                                            AnalyticsService analyticsService) {
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
        return repository.findByEnvironmentId(envId, aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findEnvironmentVariableByEnvironmentId(String envId) {
        return  findByEnvironmentId(envId, AclPermission.MANAGE_ENVIRONMENT_VARIABLES);
    }

    @Override
    public Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        return repository.findByWorkspaceId(workspaceId, aclPermission);
    }

    @Override
    public Flux<EnvironmentVariable> findEnvironmentVariableByWorkspaceId(String workspaceId) {
        return findByWorkspaceId(workspaceId, AclPermission.READ_ENVIRONMENT_VARIABLES);
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
    public Mono<EnvironmentVariable> archiveById(String id, AclPermission aclPermission) {
        Mono<EnvironmentVariable> environmentVariableMono = repository.findById(id, aclPermission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ENVIRONMENT_VARIABLE, id)));

        // scope for analytics event to be added.
        return environmentVariableMono.flatMap(repository::archive);
    }

    @Override
    public Mono<Boolean> archiveAllById(List<String> ids) {
        return repository.archiveAllById(ids);
    }

    // Update
    @Override
    public Mono<EnvironmentVariable> update(String id, EnvironmentVariable envVariable) {
        return super.update(id, envVariable);
    }

    @Override
    public  Mono<EnvironmentVariable> updateById(String id, EnvironmentVariable environmentVariable, AclPermission aclPermission) {
        return repository.updateById(id, environmentVariable, aclPermission);
    }
}
