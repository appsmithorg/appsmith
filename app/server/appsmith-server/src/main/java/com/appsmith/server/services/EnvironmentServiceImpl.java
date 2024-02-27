package com.appsmith.server.services;

import com.appsmith.external.dtos.EnvironmentDTO;
import com.appsmith.external.dtos.EnvironmentDatasourcesMeta;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ce_compatible.EnvironmentServiceCECompatibleImpl;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.external.constants.CommonFieldName.PRODUCTION_ENVIRONMENT;
import static com.appsmith.external.constants.CommonFieldName.STAGING_ENVIRONMENT;
import static com.appsmith.server.constants.FieldName.ENVIRONMENT_NAME;
import static com.appsmith.server.constants.ce.FieldNameCE.ENVIRONMENT_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PERMISSION_GROUP_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.PUBLIC_PERMISSION_GROUP;
import static com.appsmith.server.constants.ce.FieldNameCE.WORKSPACE_ID;
import static com.appsmith.server.exceptions.AppsmithError.DUPLICATE_KEY;
import static com.appsmith.server.exceptions.AppsmithError.INVALID_PARAMETER;
import static com.appsmith.server.exceptions.AppsmithError.NO_RESOURCE_FOUND;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Service
@Slf4j
public class EnvironmentServiceImpl extends EnvironmentServiceCECompatibleImpl implements EnvironmentService {

    private final PolicyGenerator policyGenerator;
    private final WorkspaceService workspaceService;
    private final PermissionGroupRepository permissionGroupRepository;
    private final ConfigService configService;

    private final DatasourceStorageRepository datasourceStorageRepository;

    private final DatasourceRepository datasourceRepository;

    private final PluginRepository pluginRepository;

    @Autowired
    public EnvironmentServiceImpl(
            Validator validator,
            EnvironmentRepository repository,
            AnalyticsService analyticsService,
            PolicyGenerator policyGenerator,
            @Lazy WorkspaceService workspaceService,
            PermissionGroupRepository permissionGroupRepository,
            ConfigService configService,
            DatasourceStorageRepository datasourceStorageRepository,
            DatasourceRepository datasourceRepository,
            PluginRepository pluginRepository) {
        super(validator, repository, analyticsService, workspaceService);
        this.workspaceService = workspaceService;
        this.policyGenerator = policyGenerator;
        this.permissionGroupRepository = permissionGroupRepository;
        this.configService = configService;
        this.datasourceStorageRepository = datasourceStorageRepository;
        this.datasourceRepository = datasourceRepository;
        this.pluginRepository = pluginRepository;
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

        if (TRUE.equals(environment.getIsDefault())) {
            return Mono.just(environment);
        }

        Mono<List<String>> defaultGroupsListMono = permissionGroupRepository
                .findAllById(workspace.getDefaultPermissionGroups())
                .filter(permissionGroup -> permissionGroup.getName().startsWith("App Viewer"))
                .map(permissionGroup -> permissionGroup.getId())
                .collectList();

        Mono<String> publicPermissionGroupMono = configService
                .getByName(PUBLIC_PERMISSION_GROUP)
                .map(config -> config.getConfig().getAsString(PERMISSION_GROUP_ID));

        return Mono.zip(defaultGroupsListMono, publicPermissionGroupMono).map(tuple2 -> {
            List<String> appViewerPermissionGroupIds = tuple2.getT1();
            String publicPermissionGroupId = tuple2.getT2();

            policies.forEach(policy -> {
                // sometimes, the permissionGroups set coming from policy generator might be immutable, which would
                // error out if any modify operation is performed
                Set<String> mutablePermissionGroup = new HashSet<>(policy.getPermissionGroups());
                mutablePermissionGroup.remove(publicPermissionGroupId);
                appViewerPermissionGroupIds.forEach(mutablePermissionGroup::remove);
                policy.setPermissionGroups(mutablePermissionGroup);
            });

            return environment;
        });
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
        return findByWorkspaceId(workspaceId, null).map(EnvironmentDTO::createEnvironmentDTO);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Mono<EnvironmentDTO> setDatasourceConfigurationDetailsForEnvironment(
            EnvironmentDTO environmentDTO, String workspaceId) {

        // All plugin maps
        Mono<Map<String, Plugin>> cachedPluginMapMono =
                pluginRepository.findAll().collectMap(Plugin::getId).cache();

        // this map stores datasource which doesn't belong to SAAS Plugin type
        Mono<Map<String, Datasource>> cachedDatasourceMapMono = cachedPluginMapMono
                .flatMap(pluginMap -> datasourceRepository
                        .findAllByWorkspaceId(workspaceId, AclPermission.EXECUTE_DATASOURCES)
                        .filter(dbDatasource -> {
                            if (!pluginMap.containsKey(dbDatasource.getPluginId())) {
                                return false;
                            }

                            PluginType pluginType =
                                    pluginMap.get(dbDatasource.getPluginId()).getType();
                            // We are not counting plugin-type from saas and remote.
                            return !PluginType.SAAS.equals(pluginType) && !PluginType.REMOTE.equals(pluginType);
                        })
                        .collectMap(Datasource::getId))
                .cache();

        return cachedDatasourceMapMono.flatMap(datasourceMap -> datasourceStorageRepository
                .findByEnvironmentId(environmentDTO.getId())
                .filter(dbDatasourceStorage -> datasourceMap.containsKey(dbDatasourceStorage.getDatasourceId()))
                .collectList()
                .flatMap(filteredDbStorageList -> {
                    EnvironmentDatasourcesMeta datasourceMeta = new EnvironmentDatasourcesMeta();
                    datasourceMeta.setTotalDatasources((long) datasourceMap.size());
                    datasourceMeta.setConfiguredDatasources((long) filteredDbStorageList.size());
                    environmentDTO.setDatasourceMeta(datasourceMeta);
                    return Mono.just(environmentDTO);
                }));
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

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_datasource_environments_enabled)
    public Mono<String> verifyEnvironmentIdByWorkspaceId(
            String workspaceId, String environmentId, AclPermission aclPermission) {
        Mono<String> environmentNameMono = findById(environmentId)
                .map(Environment::getName)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_ACCESS_ERROR, FieldName.ENVIRONMENT, FieldName.WORKSPACE)));

        return findByWorkspaceId(workspaceId, aclPermission)
                .filter(environment -> environment.getId().equals(environmentId))
                .next()
                .map(Environment::getId)
                .switchIfEmpty(Mono.defer(() -> environmentNameMono.flatMap(name -> Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ENVIRONMENT, name)))));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_custom_environments_enabled)
    public Mono<EnvironmentDTO> createCustomEnvironment(Map<String, String> customEnvironmentDetails) {
        if (!StringUtils.hasText(customEnvironmentDetails.get(ENVIRONMENT_NAME))) {
            return Mono.error(new AppsmithException(INVALID_PARAMETER, ENVIRONMENT_NAME));
        }

        if (!StringUtils.hasText(customEnvironmentDetails.get(WORKSPACE_ID))) {
            return Mono.error(new AppsmithException(INVALID_PARAMETER, WORKSPACE_ID));
        }

        // Any leading or trailing spaces are not allowed.
        String environmentName = customEnvironmentDetails.get(ENVIRONMENT_NAME).strip();
        String workspaceId = customEnvironmentDetails.get(WORKSPACE_ID).strip();

        // custom environment names can not be equal to production or staging as they are reserved
        // checking strictly by converting the provided input to lower cases
        if (isEnvironmentNameStagingOrProduction(environmentName)) {
            return Mono.error(new AppsmithException(DUPLICATE_KEY, environmentName));
        }

        Mono<Workspace> permittedWorkspaceMono =
                getWorkspaceWithPermission(workspaceId, AclPermission.WORKSPACE_CREATE_ENVIRONMENT);

        Mono<Boolean> isEnvironmentNameDuplicateMono = isEnvironmentNameDuplicate(workspaceId, environmentName);

        return Mono.zip(permittedWorkspaceMono, isEnvironmentNameDuplicateMono).flatMap(tuple2 -> {
            Workspace workspace = tuple2.getT1();
            Boolean isDuplicateEnvironmentName = tuple2.getT2();

            if (isDuplicateEnvironmentName) {
                return Mono.error(new AppsmithException(DUPLICATE_KEY, environmentName));
            }

            Environment customEnvironment = new Environment(workspace.getId(), environmentName);
            return this.generateAndSetEnvironmentPolicies(workspace, customEnvironment)
                    .flatMap(environment -> repository.save(environment))
                    .flatMap(savedEnvironment ->
                            findById(savedEnvironment.getId(), Optional.of(AclPermission.MANAGE_ENVIRONMENTS)))
                    .flatMap(dbEnvironment -> setDatasourceConfigurationDetailsForEnvironment(
                            EnvironmentDTO.createEnvironmentDTO(dbEnvironment), workspace.getId()));
        });
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_custom_environments_enabled)
    public Mono<EnvironmentDTO> deleteCustomEnvironment(String environmentId) {

        if (!StringUtils.hasLength(environmentId)) {
            return Mono.error(new AppsmithException(INVALID_PARAMETER, ENVIRONMENT_ID));
        }

        return findById(environmentId, Optional.of(AclPermission.DELETE_ENVIRONMENTS))
                .flatMap(environment -> {
                    // custom environment names can not be equal to production or staging as they are reserved
                    // checking strictly by converting the provided input to lower cases
                    if (PRODUCTION_ENVIRONMENT.equalsIgnoreCase(environment.getName())
                            || STAGING_ENVIRONMENT.equalsIgnoreCase(environment.getName())) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }

                    return repository
                            .archive(environment)
                            .flatMap(archivedEnv -> Mono.just(EnvironmentDTO.createEnvironmentDTO(archivedEnv)));
                })
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)));
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_custom_environments_enabled)
    public Mono<EnvironmentDTO> updateCustomEnvironment(String customEnvironmentId, EnvironmentDTO environmentDTO) {

        if (!StringUtils.hasText(customEnvironmentId)) {
            return Mono.error(new AppsmithException(INVALID_PARAMETER, ENVIRONMENT_ID));
        }

        if (!StringUtils.hasText(environmentDTO.getName())) {
            return Mono.error(new AppsmithException(INVALID_PARAMETER, ENVIRONMENT_NAME));
        }

        String environmentName = environmentDTO.getName().strip();

        // custom environment names can not be equal to production or staging as they are reserved
        if (isEnvironmentNameStagingOrProduction(environmentName)) {
            return Mono.error(new AppsmithException(DUPLICATE_KEY, environmentName));
        }

        Mono<Environment> environmentToUpdate = findById(
                        customEnvironmentId, Optional.of(AclPermission.MANAGE_ENVIRONMENTS))
                .flatMap(environment -> {
                    // production or staging env cant be renamed as they are reserved
                    if (isEnvironmentNameStagingOrProduction(environment.getName())) {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                    return Mono.just(environment);
                });

        return environmentToUpdate
                .flatMap(dbEnvironment -> {
                    Mono<Boolean> isEnvironmentNameDuplicateMono =
                            isEnvironmentNameDuplicate(dbEnvironment.getWorkspaceId(), environmentName);

                    return Mono.zip(isEnvironmentNameDuplicateMono, Mono.just(dbEnvironment));
                })
                .flatMap(tuple2 -> {
                    Boolean isDuplicateEnvironmentName = tuple2.getT1();
                    Environment environment = tuple2.getT2();

                    // check if any other environment with same name exists here
                    if (isDuplicateEnvironmentName) {
                        return Mono.error(new AppsmithException(DUPLICATE_KEY, environmentName));
                    }

                    // update logic
                    environment.setName(environmentName);
                    return repository
                            .save(environment)
                            .flatMap(updatedEnvironment -> setDatasourceConfigurationDetailsForEnvironment(
                                    EnvironmentDTO.createEnvironmentDTO(updatedEnvironment),
                                    environment.getWorkspaceId()));
                })
                .switchIfEmpty(Mono.error(new AppsmithException(NO_RESOURCE_FOUND, ENVIRONMENT_NAME)));
    }

    private Mono<Boolean> isEnvironmentNameDuplicate(String workspaceId, String environmentName) {
        return findByWorkspaceId(workspaceId)
                .filter(workspaceEnvironment -> workspaceEnvironment.getName().equalsIgnoreCase(environmentName))
                .next()
                .flatMap(duplicateEnvironment -> Mono.just(TRUE))
                .switchIfEmpty(Mono.just(FALSE));
    }

    private boolean isEnvironmentNameStagingOrProduction(String environmentName) {
        return PRODUCTION_ENVIRONMENT.equalsIgnoreCase(environmentName)
                || STAGING_ENVIRONMENT.equalsIgnoreCase(environmentName);
    }

    private Mono<Workspace> getWorkspaceWithPermission(String workspaceId, AclPermission permission) {
        return workspaceService
                .findById(workspaceId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)));
    }

    @Override
    public Flux<EnvironmentDTO> getOrderedEnvironmentDTOsByWorkspaceId(
            String workspaceId, Boolean fetchDatasourceMeta) {
        return getEnvironmentDTOByWorkspaceId(workspaceId)
                .flatMap(environmentDTO -> fetchDatasourceMeta
                        ? setDatasourceConfigurationDetailsForEnvironment(environmentDTO, workspaceId)
                        : Mono.just(environmentDTO))
                .sort(Comparator.comparing(EnvironmentDTO::getIsDefault)
                        .thenComparing(
                                environmentDTO -> environmentDTO.getName().equals(PRODUCTION_ENVIRONMENT)
                                        || environmentDTO.getName().equals(STAGING_ENVIRONMENT))
                        .thenComparing(EnvironmentDTO::getName)
                        .reversed());
    }
}
