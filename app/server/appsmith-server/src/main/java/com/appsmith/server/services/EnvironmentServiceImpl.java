package com.appsmith.server.services;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.services.ce.EnvironmentServiceCEImpl;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Map;
import java.util.Set;

import static com.appsmith.external.constants.CommonFieldName.PRODUCTION_ENVIRONMENT;
import static com.appsmith.external.constants.CommonFieldName.STAGING_ENVIRONMENT;
import static com.appsmith.server.constants.FieldName.ENVIRONMENT_ID;
import static com.appsmith.server.constants.FieldName.WORKSPACE_ID;
import static com.appsmith.server.exceptions.AppsmithError.INVALID_PARAMETER;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Service
@Slf4j
public class EnvironmentServiceImpl extends EnvironmentServiceCEImpl implements EnvironmentService {

    private final EnvironmentRepository repository;
    private final FeatureFlagService featureFlagService;
    private final PolicyGenerator policyGenerator;
    private final WorkspaceService workspaceService;

    @Autowired
    public EnvironmentServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  EnvironmentRepository repository,
                                  AnalyticsService analyticsService,
                                  FeatureFlagService featureFlagService,
                                  PolicyGenerator policyGenerator,
                                  @Lazy WorkspaceService workspaceService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.featureFlagService = featureFlagService;
        this.policyGenerator = policyGenerator;
        this.workspaceService = workspaceService;
    }

    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId, AclPermission aclPermission) {
        return repository.findByWorkspaceId(workspaceId, aclPermission);
    }

    @Override
    public Flux<Environment> findByWorkspaceId(String workspaceId) {
        return repository.findByWorkspaceId(workspaceId);
    }

    @Override
    public Mono<Environment> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<Environment> findById(String environmentId) {
        return repository.findById(environmentId);
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
                            .map(EnvironmentDTO::createEnvironmentDTO);
                });
    }

    @Override
    public Flux<EnvironmentDTO> getEnvironmentDTOByWorkspaceId(String workspaceId) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMapMany(isFeatureFlag -> {
                    if (Boolean.FALSE.equals(isFeatureFlag)) {
                        return workspaceService.getDefaultEnvironment(workspaceId)
                                .map(EnvironmentDTO::createEnvironmentDTO);
                    }

                    // This method will be used only for executing environments
                    return findByWorkspaceId(workspaceId, AclPermission.EXECUTE_ENVIRONMENTS)
                            .map(EnvironmentDTO::createEnvironmentDTO);
                });
    }

    @Override
    public Flux<Environment> createDefaultEnvironments(Workspace createdWorkspace) {
        return Flux.just(new Environment(createdWorkspace.getId(), PRODUCTION_ENVIRONMENT),
                        new Environment(createdWorkspace.getId(), STAGING_ENVIRONMENT))
                .map(environment -> this.generateAndSetEnvironmentPolicies(createdWorkspace, environment))
                .flatMap(repository::save);
    }

    private Environment generateAndSetEnvironmentPolicies(Workspace workspace, Environment environment) {
        Set<Policy> policies = policyGenerator.getAllChildPolicies(workspace.getPolicies(), Workspace.class, Environment.class);
        environment.setPolicies(policies);
        return environment;
    }

    @Override
    public Flux<Environment> archiveByWorkspaceId(String workspaceId) {
        return repository
                .findByWorkspaceId(workspaceId)
                .flatMap(repository::archive);
    }

    @Override
    public Mono<EnvironmentDTO> setEnvironmentToDefault(Map<String, String> defaultEnvironmentDetails) {

        return featureFlagService.check(FeatureFlagEnum.DATASOURCE_ENVIRONMENTS)
                .flatMap(isFeatureFlag -> {
                    if (Boolean.FALSE.equals(isFeatureFlag)) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    String environmentId = defaultEnvironmentDetails.get(FieldName.ENVIRONMENT_ID);
                    String workspaceId = defaultEnvironmentDetails.get(FieldName.WORKSPACE_ID);

                    // TODO: change the exception to a more appropriate one, once we have appropriate error code in EE

                    if (!StringUtils.hasLength(environmentId)) {
                        return Mono.error(new AppsmithException(INVALID_PARAMETER, ENVIRONMENT_ID));
                    }

                    // TODO: change the exception to a more appropriate one, once we have appropriate error code in EE
                    if (!StringUtils.hasLength(workspaceId)) {
                        return Mono.error(new AppsmithException(INVALID_PARAMETER, WORKSPACE_ID));
                    }


                    // not querying by permission here as the user who has access to manage workspaces,
                    // should be able to change environment metadata
                    Mono<EnvironmentDTO> environmentDTOMono =
                            findByWorkspaceId(workspaceId)
                                    .collectMap(Environment::getId)
                                    .flatMap(environmentMap -> {
                                        if (!environmentMap.containsKey(environmentId)) {
                                            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND));
                                        }

                                        return Flux.fromIterable(environmentMap.values())
                                                .flatMap(environment -> {
                                                    if (FALSE.equals(environment.getIsDefault())) {
                                                        if (environment.getId().equals(environmentId)) {
                                                            environment.setIsDefault(TRUE);
                                                            return repository.save(environment);
                                                        }

                                                        return Mono.just(environment);
                                                    }

                                                    if (environment.getId().equals(environmentId)) {
                                                        return Mono.just(environment);
                                                    }

                                                    environment.setIsDefault(FALSE);
                                                    return repository.save(environment);
                                                })
                                                .filter(environment -> environment.getId().equals(environmentId))
                                                .map(EnvironmentDTO::createEnvironmentDTO)
                                                .next();
                                    });

                    return workspaceService.findById(workspaceId, AclPermission.MANAGE_WORKSPACES)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                            .then(environmentDTOMono);
                });
    }
}
