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
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;

import javax.validation.Validator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    @Override
    public Mono<Environment> save(Environment environment) {
        return super.create(environment);
    }

    @Override
    public Flux<EnvironmentDTO> updateEnvironment(List<EnvironmentDTO> environmentDTOList) {

        Set<EnvironmentVariable> envVarToArchive = new HashSet<>();
        Set<EnvironmentVariable> envVarToUpdate = new HashSet<>();
        Set<EnvironmentVariable> envVarToSave = new HashSet<>();

        return Flux.fromIterable(environmentDTOList)
                .flatMap(environmentDTO -> {
            for (EnvironmentVariable envVar: environmentDTO.getEnvironmentVariableList()) {
                if (envVar.getId() == null) {
                    envVarToSave.add(envVar);
                } else if (envVar.isDeleted()) {
                    envVarToArchive.add(envVar);
                } else {
                    envVarToUpdate.add(envVar);
                }
            }
            EnvironmentDTO environmentDTO1 = new EnvironmentDTO();
            environmentDTO1.setId(environmentDTO.getId());
            environmentDTO1.setName(environmentDTO.getName());
            environmentDTO1.setWorkspaceId(environmentDTO.getWorkspaceId());

            Mono<List<EnvironmentVariable>> updatedEnvVarListMono = Flux.fromIterable(envVarToUpdate).flatMap(envVar -> {
                return environmentVariableService.findById(envVar.getId(), AclPermission.MANAGE_ENVIRONMENT_VARIABLES)
                        .map(dbEnvVar -> {
                                copyNewFieldValuesIntoOldObject(envVar, dbEnvVar);
                                return dbEnvVar;
                        }).flatMap(dbEnvVar -> environmentVariableService.update(dbEnvVar.getId(), dbEnvVar));
            }).collectList();

            Mono<List<EnvironmentVariable>> archivedEnvVarListMono = Flux.fromIterable(envVarToArchive).flatMap(archiveEnvVar -> {
                return environmentVariableService.archiveById(archiveEnvVar.getId());
            }).collectList();

            Mono<List<EnvironmentVariable>> newEnvVarListMono = Flux.fromIterable(envVarToSave).flatMap(envVar -> {
                return environmentVariableService.save(envVar);
            }).collectList();

            envVarToArchive.clear();
            envVarToUpdate.clear();
            envVarToSave.clear();

            return Mono.zip(Mono.just(environmentDTO1), updatedEnvVarListMono, archivedEnvVarListMono, newEnvVarListMono)
                    .map(tuple -> {
                        EnvironmentDTO environmentDTO2 = tuple.getT1();
                        List<EnvironmentVariable> archivedList = tuple.getT3();
                        List<EnvironmentVariable> updatedList = tuple.getT2();
                        List<EnvironmentVariable> savedList = tuple.getT4();

                        environmentDTO2.setEnvironmentVariableList(updatedList);
                        environmentDTO2.getEnvironmentVariableList().addAll(savedList);
                        environmentDTO2.getEnvironmentVariableList().addAll(archivedList);
                        return environmentDTO2;
                    });
        });


    }

}
