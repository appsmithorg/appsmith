package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.dtos.EnvironmentDTO;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.services.ce.EnvironmentServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.List;

@Service
@Slf4j
public class EnvironmentServiceImpl extends EnvironmentServiceCEImpl implements EnvironmentService {

    private final EnvironmentRepository repository;

    private final EnvironmentVariableService environmentVariableService;

    @Autowired
    public EnvironmentServiceImpl(Scheduler scheduler,
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
                .flatMap(environmentDTO -> {
                    return Mono.zip(Mono.justOrEmpty(environmentDTO),
                                    environmentVariableService.findByEnvironmentId(envId, AclPermission.MANAGE_ENVIRONMENT_VARIABLES)
                                            .collectList().defaultIfEmpty(List.of()))
                            .map(tuple -> {
                                EnvironmentDTO environmentDTO1 = tuple.getT1();
                                List<EnvironmentVariable> environmentVariableList = tuple.getT2();
                                environmentDTO1.setEnvironmentVariableList(environmentVariableList);
                                return environmentDTO1;
                            });

                });
    }

    @Override
    public Flux<EnvironmentDTO> findEnvironmentByWorkspaceId(String workspaceId) {

        return findByWorkspaceId(workspaceId, AclPermission.MANAGE_ENVIRONMENTS)
                .map(this::createEnvironmentDTO)
                .flatMap(environmentDTO -> {
                    return Mono.zip(Mono.justOrEmpty(environmentDTO),
                                    environmentVariableService
                                            .findByEnvironmentId(environmentDTO.getId(), AclPermission.MANAGE_ENVIRONMENT_VARIABLES)
                                            .collectList().defaultIfEmpty(List.of()))
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
