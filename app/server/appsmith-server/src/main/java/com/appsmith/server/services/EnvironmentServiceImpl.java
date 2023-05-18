package com.appsmith.server.services;

import com.appsmith.external.constants.CommonFieldName;
import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.Workspace;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Set;

@Service
@Slf4j
public class EnvironmentServiceImpl extends EnvironmentServiceCEImpl implements EnvironmentService {

    private final EnvironmentRepository repository;
    private final FeatureFlagService featureFlagService;

    private final PolicyGenerator policyGenerator;

    @Autowired
    public EnvironmentServiceImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  EnvironmentRepository repository,
                                  AnalyticsService analyticsService,
                                  FeatureFlagService featureFlagService,
                                  PolicyGenerator policyGenerator) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
        this.featureFlagService = featureFlagService;
        this.policyGenerator = policyGenerator;
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
                        return Flux.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }

                    // This method will be used only for executing environments
                    return findByWorkspaceId(workspaceId, AclPermission.EXECUTE_ENVIRONMENTS)
                            .map(EnvironmentDTO::createEnvironmentDTO);
                });
    }

    @Override
    public Flux<Environment> createDefaultEnvironments(Workspace createdWorkspace) {
        return Flux.just(new Environment(createdWorkspace.getId(), CommonFieldName.PRODUCTION_ENVIRONMENT),
                        new Environment(createdWorkspace.getId(), CommonFieldName.STAGING_ENVIRONMENT))
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
}
