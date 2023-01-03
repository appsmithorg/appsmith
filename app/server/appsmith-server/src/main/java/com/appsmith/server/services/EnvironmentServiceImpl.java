package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Environment;
import com.appsmith.server.domains.EnvironmentVariable;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.EnvironmentDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
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

import java.util.List;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNewFieldValuesIntoOldObject;

@Service
@Slf4j
public class EnvironmentServiceImpl extends EnvironmentServiceCEImpl implements EnvironmentService {

    private final EnvironmentRepository repository;

    private final WorkspaceRepository workspaceRepository;

    private final PolicyGenerator policyGenerator;

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
                                  FeatureFlagService featureFlagService,
                                  WorkspaceRepository workspaceRepository,
                                  PolicyGenerator policyGenerator) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.environmentVariableService = environmentVariableService;
        this.workspaceRepository = workspaceRepository;
        this.policyGenerator = policyGenerator;
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
    public Mono<EnvironmentDTO> findEnvironmentByEnvironmentId(String envId) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMap(truth -> {

                    if (Boolean.FALSE.equals(truth)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    return findById(envId, AclPermission.READ_ENVIRONMENTS)
                            .map(this::createEnvironmentDTO)
                            .flatMap(environmentDTO -> {
                                return Mono.zip(Mono.justOrEmpty(environmentDTO),
                                                environmentVariableService.findByEnvironmentId(envId, AclPermission.READ_ENVIRONMENT_VARIABLES)
                                                        .collectList())
                                        .map(tuple -> {
                                            EnvironmentDTO environmentDTO1 = tuple.getT1();
                                            List<EnvironmentVariable> environmentVariableList = tuple.getT2();
                                            environmentDTO1.setEnvironmentVariableList(environmentVariableList);
                                            return environmentDTO1;
                                        });
                            });

                });
    }

    @Override
    public Flux<EnvironmentDTO> findEnvironmentByWorkspaceId(String workspaceId) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMapMany(truth -> {

                    if (Boolean.FALSE.equals(truth)) {
                        return Flux.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    return findByWorkspaceId(workspaceId, AclPermission.READ_ENVIRONMENTS)
                            .map(this::createEnvironmentDTO)
                            .flatMap(environmentDTO -> {
                                return Mono.zip(Mono.justOrEmpty(environmentDTO),
                                                environmentVariableService
                                                        .findByEnvironmentId(environmentDTO.getId(), AclPermission.READ_ENVIRONMENT_VARIABLES)
                                                        .collectList())
                                        .map(tuple -> {
                                            EnvironmentDTO environmentDTO1 = tuple.getT1();
                                            List<EnvironmentVariable> environmentVariableList = tuple.getT2();
                                            environmentDTO1.setEnvironmentVariableList(environmentVariableList);
                                            return environmentDTO1;
                                        });
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
        return create(environment);
    }

    @Override
    public Flux<EnvironmentDTO> updateEnvironment(List<EnvironmentDTO> environmentDTOList) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMapMany(truth -> {

                    if (Boolean.FALSE.equals(truth)) {
                        return Flux.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    final Environment environment = new Environment();

                    return Flux.fromIterable(environmentDTOList)
                            .flatMap(environmentDTO -> {
                                return Mono.just(environmentDTO)
                                        .zipWith(findById(environmentDTO.getId(), AclPermission.READ_ENVIRONMENTS),
                                                (environmentDTO1, env) -> {
                                                    environment.setId(env.getId());
                                                    environment.setPolicies(env.getPolicies());
                                                    environment.setName(env.getName());
                                                    environment.setWorkspaceId(env.getWorkspaceId());
                                                    return environmentDTO1;
                                                });
                            })
                            .flatMap(environmentDTO -> {
                                EnvironmentDTO environmentDTO1 = new EnvironmentDTO();
                                environmentDTO1.setId(environment.getId());
                                environmentDTO1.setName(environment.getName());
                                environmentDTO1.setWorkspaceId(environment.getWorkspaceId());

                                return Mono.just(environmentDTO1)
                                        .zipWith(Flux.fromIterable(environmentDTO.getEnvironmentVariableList())
                                                .flatMap(envVar -> {
                                                    if (!StringUtils.hasLength(envVar.getId())) {
                                                        // save logic
                                                        envVar.setEnvironmentId(environment.getId());
                                                        envVar.setWorkspaceId(environment.getWorkspaceId());
                                                        envVar.setPolicies(policyGenerator
                                                                .getAllChildPolicies(environment.getPolicies(), Environment.class, EnvironmentVariable.class));
                                                        return environmentVariableService.save(envVar);
                                                    } else if (envVar.getDeletedAt() == null) {
                                                        // update logic
                                                        return environmentVariableService
                                                                .findById(envVar.getId(), AclPermission.MANAGE_ENVIRONMENT_VARIABLES)
                                                                .map(dbEnvVar -> {
                                                                    envVar.setWorkspaceId(dbEnvVar.getWorkspaceId());
                                                                    envVar.setEnvironmentId(dbEnvVar.getEnvironmentId());
                                                                    envVar.setPolicies(dbEnvVar.getPolicies());
                                                                    copyNewFieldValuesIntoOldObject(envVar, dbEnvVar);
                                                                    return dbEnvVar;
                                                                })
                                                                .flatMap(dbEnvVar -> environmentVariableService.save(dbEnvVar));
                                                    } else {
                                                        // archive logic
                                                        return environmentVariableService
                                                                .archiveById(envVar.getId(), AclPermission.MANAGE_ENVIRONMENT_VARIABLES);
                                                    }

                                                })
                                                .collectList(), (environmentDTO2, envVarList) -> {
                                            environmentDTO2.setEnvironmentVariableList(envVarList);
                                            return environmentDTO2;
                                        });
                            });


                });
    }

    @Override
    public Mono<EnvironmentDTO> createNewEnvironment(EnvironmentDTO environmentDTO) {
        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMap(truth -> {
                    if (Boolean.FALSE.equals(truth)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    if (!StringUtils.hasLength(environmentDTO.getWorkspaceId())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
                    }

                    if (!StringUtils.hasLength(environmentDTO.getName())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ENVIRONMENT));
                    }

                    Mono<List<Environment>> environmentListMono = repository.findByWorkspaceId(environmentDTO.getWorkspaceId(), AclPermission.CREATE_ENVIRONMENTS)
                            .filter(environment -> environmentDTO.getName()
                                    .equals(environment.getName()))
                            .collectList();

                    return environmentListMono
                            .flatMap(envList -> {
                                if (!envList.isEmpty()) {
                                    return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY, FieldName.ENVIRONMENT));
                                }
                                return Mono.just(envList);
                            })
                            .then(workspaceRepository.findById(environmentDTO.getWorkspaceId(), AclPermission.MANAGE_WORKSPACES))
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE)))
                            .map(workspace -> {
                                Set<Policy> environmentPolicy = policyGenerator.getAllChildPolicies(workspace.getPolicies(), Workspace.class, Environment.class);
                                Environment env = new Environment();
                                env.setName(environmentDTO.getName());
                                env.setWorkspaceId(environmentDTO.getWorkspaceId());
                                env.setPolicies(environmentPolicy);
                                return env;
                            })
                            .flatMap(environment -> create(environment))
                            .map(this::createEnvironmentDTO);


                });
    }

}
