package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.EnvironmentVariable;
import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.services.ce.EnvironmentServiceCEImpl;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;

@Service
@Slf4j
public class EnvironmentServiceImpl extends EnvironmentServiceCEImpl implements EnvironmentService {

    private final EnvironmentRepository repository;
    private final EnvironmentVariableService environmentVariableService;
    private final FeatureFlagService featureFlagService;

    @Autowired
    public EnvironmentServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  EnvironmentRepository repository,
                                  AnalyticsService analyticsService,
                                  EnvironmentVariableService environmentVariableService,
                                  FeatureFlagService featureFlagService){
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.environmentVariableService = environmentVariableService;
        this.featureFlagService = featureFlagService;
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
    public Flux<Environment> findByWorkspaceIdWithoutPermission(String workspaceId) {
        return repository.findByWorkspaceId(workspaceId, (AclPermission) null);
    }

    @Override
    public Mono<EnvironmentDTO> getEnvironmentDTOByEnvironmentId(String envId) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMap(isFeatureFlag -> {
                    if (Boolean.FALSE.equals(isFeatureFlag)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    // This method will be used only for executing environments
                    return findById(envId, AclPermission.EXECUTE_ENVIRONMENTS)
                            .flatMap(this::findAndPlugEnvironmentVariableInEnvironmentDTO);
                });
    }

    @Override
    public Flux<EnvironmentDTO> getEnvironmentDTOByWorkspaceId(String workspaceId) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMapMany(isFeatureFlag -> {
                    if (Boolean.FALSE.equals(isFeatureFlag)) {
                        return Flux.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    // This method will be used only for executing environments
                    return findByWorkspaceId(workspaceId, AclPermission.EXECUTE_ENVIRONMENTS)
                            .flatMap(this::findAndPlugEnvironmentVariableInEnvironmentDTO);
                });
    }

    private Mono<EnvironmentDTO> findAndPlugEnvironmentVariableInEnvironmentDTO(Environment environment) {
        return Mono.just(environment)
                .map(this::createEnvironmentDTO)
                .flatMap(environmentDTO -> {
                    String environmentId = environmentDTO.getId();
                    return environmentVariableService
                            .findByEnvironmentId(environmentId)
                            .collectList()
                            .map(environmentVariableList -> {
                                environmentDTO.setEnvironmentVariableList(environmentVariableList);
                                return environmentDTO;
                            });
                });
    }

    @Override
    public EnvironmentDTO createEnvironmentDTO(Environment environment) {
        EnvironmentDTO environmentDTO = new EnvironmentDTO();
        environmentDTO.setId(environment.getId());
        environmentDTO.setName(environment.getName());
        environmentDTO.setWorkspaceId(environment.getWorkspaceId());
        environmentDTO.setUserPermissions(environment.getUserPermissions());
        return environmentDTO;
    }

    @Override
    public Mono<Environment> save(Environment environment) {
        return repository.save(environment);
    }

    @Override
    public Flux<EnvironmentDTO> updateEnvironment(List<EnvironmentDTO> environmentDTOList) {
        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMapMany( truth -> {
                    if (Boolean.FALSE.equals(truth)) {
                        return Flux.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    Map<String, EnvironmentDTO> environmentDTOMap = new HashMap<>();
                    for (EnvironmentDTO environmentDTO: environmentDTOList) {
                        environmentDTOMap.put(environmentDTO.getId(), environmentDTO);
                    }

                    return Flux.fromIterable(environmentDTOMap.keySet())
                            .flatMap(environmentId -> findById(environmentId, AclPermission.MANAGE_ENVIRONMENTS))
                            .flatMap(environment -> {
                                EnvironmentDTO environmentDTO = environmentDTOMap.get(environment.getId());

                                Flux<EnvironmentVariable> environmentVariableFlux =
                                        Flux.fromIterable(environmentDTO.getEnvironmentVariableList())
                                                .flatMap(envVar -> {
                                                    // The assumption is that variables without an id are new,
                                                    // and will be created to be saved in DB, if variable has Id,
                                                    // then without the delete flag, needs to be modified,
                                                    // and one with delete flag would be deleted.

                                                    if (!StringUtils.hasLength(envVar.getId())) {
                                                        // save logic
                                                        envVar.setEnvironmentId(environment.getId());
                                                        envVar.setWorkspaceId(environment.getWorkspaceId());
                                                        envVar.setDatasourceId(environmentDTO.getDatasourceId());
                                                        return environmentVariableService.create(envVar);

                                                    } else if (envVar.getDeletedAt() == null) {
                                                        // update logic
                                                        return environmentVariableService
                                                                .findById(envVar.getId())
                                                                .map(dbEnvVar -> {
                                                                    // checking if the fetched variable lies within the same environment
                                                                    if (!dbEnvVar.getEnvironmentId()
                                                                            .equals(environment.getId())) {
                                                                        return dbEnvVar;
                                                                    }
                                                                    envVar.setWorkspaceId(dbEnvVar.getWorkspaceId());
                                                                    envVar.setEnvironmentId(dbEnvVar.getEnvironmentId());
                                                                    envVar.setDatasourceId(environmentDTO.getDatasourceId());
                                                                    copyNewFieldValuesIntoOldObject(envVar, dbEnvVar);
                                                                    return dbEnvVar;
                                                                })
                                                                .flatMap(environmentVariableService::save);
                                                    } else {
                                                        // archive logic
                                                        return environmentVariableService
                                                                .archiveById(envVar.getId());
                                                    }
                                                });

                                return environmentVariableFlux.collectList()
                                        .map(envVarList ->{
                                            EnvironmentDTO responseEnvironmentDTO = createEnvironmentDTO(environment);
                                            responseEnvironmentDTO.setEnvironmentVariableList(envVarList);
                                            return responseEnvironmentDTO;
                                        });
                            });

                });
    }

}
