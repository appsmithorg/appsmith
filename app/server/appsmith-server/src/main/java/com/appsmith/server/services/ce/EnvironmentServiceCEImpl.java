package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.dtos.EnvironmentDTO;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.services.EnvironmentVariableService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;
import com.appsmith.server.repositories.EnvironmentRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import javax.validation.Validator;

@Slf4j
public class EnvironmentServiceCEImpl extends BaseService<EnvironmentRepository, Environment, String> implements EnvironmentServiceCE {

    private final EnvironmentRepository repository;

    private final EnvironmentVariableService environmentVariableService;

    @Autowired
    public EnvironmentServiceCEImpl(Scheduler scheduler,
                                    Validator validator,
                                    MongoConverter mongoConverter,
                                    ReactiveMongoTemplate reactiveMongoTemplate,
                                    EnvironmentRepository repository,
                                    AnalyticsService analyticsService,
                                    EnvironmentVariableService environmentVariableService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.environmentVariableService = environmentVariableService;
    }

    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        return repository.findByWorkspaceId(workspaceId, aclPermission);
    }

    @Override
    public Mono<Environment> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<EnvironmentDTO> findEnvironmentByEnvironmentId(String envId) {

        return findById(envId, AclPermission.MANAGE_ENVIRONMENTS)
                .map(this::createEnvironmentDTO)
                .zipWith( environmentVariableService.findByEnvironmentId(envId, AclPermission.MANAGE_ENVIRONMENT_VARIABLES).collectList(),
                        (environmentDTO, envVarList) -> {
                    environmentDTO.setEnvironmentVariableList(envVarList);
                    return environmentDTO;
                });
    }

    @Override
    public Flux<EnvironmentDTO> findEnvironmentByWorkspaceId(String workspaceId) {

        return findByWorkspaceId(workspaceId, AclPermission.MANAGE_ENVIRONMENTS)
                .map(this::createEnvironmentDTO)
                .flatMap(environmentDTO -> {
                    return Mono.zip(Mono.just(environmentDTO),
                            environmentVariableService
                                    .findByEnvironmentId(environmentDTO.getId(), AclPermission.MANAGE_ENVIRONMENT_VARIABLES)
                                    .collectList())
                            .map(tuple -> {
                                EnvironmentDTO environmentDTO1 = tuple.getT1();
                                List<EnvironmentVariable> environmentVariableList = tuple.getT2();
                                environmentDTO1.setEnvironmentVariableList(environmentVariableList);
                                return environmentDTO1;
                            });
                });
    }

    @Override
    public EnvironmentDTO createEnvironmentDTO(Environment environment) {
        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setId(environment.getId());
        environmentDTO.setName(environment.getName());
        environmentDTO.setWorkspaceId(environmentDTO.getWorkspaceId());
        return environmentDTO;
    }

}
