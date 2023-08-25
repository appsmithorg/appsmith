package com.appsmith.server.services;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.services.ce_compatible.EnvironmentServiceCECompatibleImpl;
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

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.external.constants.CommonFieldName.PRODUCTION_ENVIRONMENT;
import static com.appsmith.external.constants.CommonFieldName.STAGING_ENVIRONMENT;
import static com.appsmith.server.constants.ce.FieldNameCE.ENVIRONMENT_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PUBLIC_PERMISSION_GROUP;
import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE_ID;
import static com.appsmith.server.exceptions.AppsmithError.INVALID_PARAMETER;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Service
@Slf4j
public class EnvironmentServiceImpl extends EnvironmentServiceCECompatibleImpl implements EnvironmentService {

    private final PolicyGenerator policyGenerator;
    private final WorkspaceService workspaceService;
    private final PermissionGroupRepository permissionGroupRepository;
    private final ConfigService configService;

    @Autowired
    public EnvironmentServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            EnvironmentRepository repository,
            AnalyticsService analyticsService,
            PolicyGenerator policyGenerator,
            @Lazy WorkspaceService workspaceService,
            PermissionGroupRepository permissionGroupRepository,
            ConfigService configService) {
        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                workspaceService);
        this.workspaceService = workspaceService;
        this.policyGenerator = policyGenerator;
        this.permissionGroupRepository = permissionGroupRepository;
        this.configService = configService;
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
    public Mono<Environment> findById(String id, Optional<AclPermission> aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<Environment> findById(String environmentId) {
        return repository.findById(environmentId);
    }

    @Override
    public Flux<Environment> createDefaultEnvironments(Workspace createdWorkspace) {
        return Flux.just(
                        new Environment(createdWorkspace.getId(), PRODUCTION_ENVIRONMENT),
                        new Environment(createdWorkspace.getId(), STAGING_ENVIRONMENT))
                .flatMap(environment -> this.generateAndSetEnvironmentPolicies(createdWorkspace, environment))
                .flatMap(repository::save);
    }

    private Mono<Environment> generateAndSetEnvironmentPolicies(Workspace workspace, Environment environment) {
        Set<Policy> policies =
                policyGenerator.getAllChildPolicies(workspace.getPolicies(), Workspace.class, Environment.class);
        environment.setPolicies(policies);
        if (!Boolean.TRUE.equals(environment.getIsDefault())) {
            Mono<List<String>> defaultGroupsListMono = permissionGroupRepository
                    .findAllById(workspace.getDefaultPermissionGroups())
                    .filter(permissionGroup -> permissionGroup.getName().startsWith("App Viewer"))
                    .map(permissionGroup -> permissionGroup.getId())
                    .collectList();
            Mono<String> publicPermissionGroupMono = configService
                    .getByName(PUBLIC_PERMISSION_GROUP)
                    .map(config -> config.getConfig().getAsString(PERMISSION_GROUP_ID));

            return Mono.zip(defaultGroupsListMono, publicPermissionGroupMono).map(tuple2 -> {
                policies.stream().forEach(policy -> {
                    tuple2.getT1().forEach(policy.getPermissionGroups()::remove);
                    policy.getPermissionGroups().remove(tuple2.getT2());
                });
                return environment;
            });
        }
        return Mono.just(environment);
    }

    @Override
    public Flux<Environment> archiveByWorkspaceId(String workspaceId) {
        return repository.findByWorkspaceId(workspaceId).flatMap(repository::archive);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Mono<EnvironmentDTO> getEnvironmentDTOByEnvironmentId(String envId) {
        // This method will be used only for executing environments
        return findById(envId, Optional.of(AclPermission.EXECUTE_ENVIRONMENTS))
                .map(EnvironmentDTO::createEnvironmentDTO);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Flux<EnvironmentDTO> getEnvironmentDTOByWorkspaceId(String workspaceId) {
        // This method will be used only for executing environments
        return findByWorkspaceId(workspaceId, null)
                .map(EnvironmentDTO::createEnvironmentDTO)
                .sort(Comparator.comparing(EnvironmentDTO::getIsDefault).reversed());
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Mono<EnvironmentDTO> setEnvironmentToDefault(Map<String, String> defaultEnvironmentDetails) {
        String environmentId = defaultEnvironmentDetails.get(ENVIRONMENT_ID);
        String workspaceId = defaultEnvironmentDetails.get(WORKSPACE_ID);

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
        Mono<EnvironmentDTO> environmentDTOMono = findByWorkspaceId(workspaceId)
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

        return workspaceService
                .findById(workspaceId, AclPermission.MANAGE_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .then(environmentDTOMono);
    }
}
