package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.external.models.EnvironmentVariable;
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
                                            EnvironmentVariableRepository environmentVariableRepository,
                                            AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, environmentVariableRepository, analyticsService);
    }

    @Override
    public Mono<EnvironmentVariable> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Flux<EnvironmentVariable> findAllByIds(List<String> ids) {
        return repository.findAllByIds(ids);
    }

    @Override
    public Flux<EnvironmentVariable> findByEnvironmentId(String envId) {
        return repository.findByEnvironmentId(envId);
    }

    @Override
    public Flux<EnvironmentVariable> findByWorkspaceId(String workspaceId) {
        return repository.findByWorkspaceId(workspaceId);
    }

    @Override
    public Flux<EnvironmentVariable> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        return repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId);
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
        return this.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ENVIRONMENT_VARIABLE, id)))
                .flatMap(repository::archive);
    }

    @Override
    public Mono<Boolean> archiveAllById(List<String> ids) {
        return repository.archiveAllById(ids);
    }

    @Override
    public Flux<EnvironmentVariable> findByNameAndWorkspaceId(List<String> envVarNameList, String workspaceId) {
        return repository.findByNameAndWorkspaceId(envVarNameList, workspaceId);
    }

    // used for fetching variables when we get variable names from dynamicBinding path map
    @Override
    public Flux<EnvironmentVariable> findByEnvironmentIdAndVariableNames(String environmentId, List<String> envVarNames) {
        return repository.findByEnvironmentIdAndVariableNames(environmentId, envVarNames);
    }

    // will be used for archiving when we are deleting the variables for which the user doesn't have access to
    // as it will be in different environment
    @Override
    public Mono<EnvironmentVariable> archiveByNameAndEnvironmentId(EnvironmentVariable envVar) {
        return repository.archiveByNameAndEnvironmentId(envVar);
    }

    // will be used for archiving variables when we are deleting the datasource
    @Override
    public Mono<Long> archiveByDatasourceIdAndWorkspaceId(String datasourceId, String workspaceId) {
        return repository.archiveByDatasourceIdAndWorkspaceId(datasourceId, workspaceId);
    }
}
