package com.appsmith.server.datasources.base;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Policy;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.DBOpsType;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.WorkspacePermission;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.external.constants.spans.DatasourceSpan.FETCH_ALL_DATASOURCES_WITH_STORAGES;
import static com.appsmith.external.constants.spans.DatasourceSpan.FETCH_ALL_PLUGINS_IN_WORKSPACE;
import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.constants.ce.FieldNameCE.INSTANCE_ID;
import static com.appsmith.server.constants.ce.FieldNameCE.TENANT_ID;
import static com.appsmith.server.dtos.DBOpsType.SAVE;
import static com.appsmith.server.helpers.CollectionUtils.isNullOrEmpty;
import static com.appsmith.server.helpers.DatasourceAnalyticsUtils.getAnalyticsProperties;
import static com.appsmith.server.helpers.DatasourceAnalyticsUtils.getAnalyticsPropertiesForTestEventStatus;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static org.springframework.util.StringUtils.hasText;

@Slf4j
public class DatasourceServiceCEImpl implements DatasourceServiceCE {

    private final DatasourceRepository repository;
    private final WorkspaceService workspaceService;
    private final SessionUserService sessionUserService;
    protected final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PolicyGenerator policyGenerator;
    private final SequenceService sequenceService;
    private final NewActionRepository newActionRepository;
    private final DatasourceContextService datasourceContextService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    protected final DatasourceStorageService datasourceStorageService;
    private final AnalyticsService analyticsService;
    private final EnvironmentPermission environmentPermission;
    private final RateLimitService rateLimitService;
    private final FeatureFlagService featureFlagService;
    private final ObservationRegistry observationRegistry;
    private final OrganizationService organizationService;
    private final ConfigService configService;

    // Defines blocking duration for test as well as connection created for query execution
    // This will block the creation of datasource connection for 5 minutes, in case of more than 3 failed connection
    // attempts
    private final Integer BLOCK_TEST_API_DURATION = 5;
    private final AppsmithException TOO_MANY_REQUESTS_EXCEPTION =
            new AppsmithException(AppsmithError.TOO_MANY_FAILED_DATASOURCE_CONNECTION_REQUESTS);

    @Autowired
    public DatasourceServiceCEImpl(
            DatasourceRepository repository,
            WorkspaceService workspaceService,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            PolicyGenerator policyGenerator,
            SequenceService sequenceService,
            NewActionRepository newActionRepository,
            DatasourceContextService datasourceContextService,
            DatasourcePermission datasourcePermission,
            WorkspacePermission workspacePermission,
            DatasourceStorageService datasourceStorageService,
            EnvironmentPermission environmentPermission,
            RateLimitService rateLimitService,
            FeatureFlagService featureFlagService,
            ObservationRegistry observationRegistry,
            OrganizationService organizationService,
            ConfigService configService) {

        this.workspaceService = workspaceService;
        this.sessionUserService = sessionUserService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.policyGenerator = policyGenerator;
        this.sequenceService = sequenceService;
        this.newActionRepository = newActionRepository;
        this.datasourceContextService = datasourceContextService;
        this.datasourcePermission = datasourcePermission;
        this.workspacePermission = workspacePermission;
        this.datasourceStorageService = datasourceStorageService;
        this.analyticsService = analyticsService;
        this.repository = repository;
        this.environmentPermission = environmentPermission;
        this.rateLimitService = rateLimitService;
        this.featureFlagService = featureFlagService;
        this.observationRegistry = observationRegistry;
        this.organizationService = organizationService;
        this.configService = configService;
    }

    @Override
    public Mono<Datasource> create(Datasource datasource) {
        return workspacePermission
                .getDatasourceCreatePermission()
                .flatMap(permission -> createEx(datasource, permission, false, null));
    }

    // TODO: Check usage
    @Override
    public Mono<Datasource> createWithoutPermissions(
            Datasource datasource, Map<DBOpsType, List<DatasourceStorage>> datasourceStorageDryRunQueries) {
        return createEx(datasource, null, true, datasourceStorageDryRunQueries);
    }

    @Override
    public Mono<Datasource> createWithoutPermissions(Datasource datasource) {
        return createEx(datasource, null, false, null);
    }

    private Mono<Datasource> createEx(
            @NotNull Datasource datasource,
            AclPermission permission,
            boolean isDryOps,
            Map<DBOpsType, List<DatasourceStorage>> datasourceStorageDryRunQueries) {
        // Validate incoming request
        String workspaceId = datasource.getWorkspaceId();
        if (!hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }
        if (!hasText(datasource.getPluginId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PLUGIN_ID));
        }
        if (!hasText(datasource.getGitSyncId())) {
            datasource.setGitSyncId(datasource.getWorkspaceId() + "_" + UUID.randomUUID());
        }

        if (isNullOrEmpty(datasource.getDatasourceStorages())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.DATASOURCE));
        }

        // Set this to null, datasource configuration has moved to datasourceStorage, we will stop storing this.
        datasource.nullifyStorageReplicaFields();
        Mono<Datasource> datasourceMono = Mono.just(datasource);

        // First check if this is an existing datasource or whether we need to create one
        if (!hasText(datasource.getId())) {
            // We need to create the datasource as well

            // Determine valid name for datasource
            if (!hasText(datasource.getName())) {
                datasourceMono = sequenceService
                        .getNextAsSuffix(Datasource.class, " for workspace with _id : " + workspaceId)
                        .map(sequenceNumber -> {
                            datasource.setName(Datasource.DEFAULT_NAME_PREFIX + sequenceNumber);
                            return datasource;
                        });
            }
            datasourceMono = datasourceMono
                    .map(datasource1 -> {
                        // Everything we create needs to use configs from storage
                        datasource1.setHasDatasourceStorage(true);
                        return datasource1;
                    })
                    .flatMap(datasource1 -> {
                        Mono<User> userMono = sessionUserService.getCurrentUser();
                        return generateAndSetDatasourcePolicies(userMono, datasource1, permission);
                    })
                    .flatMap(datasourceInDb -> validateAndSaveDatasourceToRepository(datasourceInDb, isDryOps))
                    .flatMap(savedDatasource ->
                            analyticsService.sendCreateEvent(savedDatasource, getAnalyticsProperties(savedDatasource)));
        } else {
            log.debug(
                    "datasource with name: {} already exists, Only configuration(s) will be created",
                    datasource.getName());
            datasourceMono = datasourceMono.flatMap(
                    datasource1 -> findById(datasource1.getId(), datasourcePermission.getEditPermission())
                            .map(datasource2 -> {
                                datasource2.setDatasourceStorages(datasource1.getDatasourceStorages());
                                return datasource2;
                            })
                            .switchIfEmpty(Mono.error(
                                    new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE))));
        }

        return datasourceMono.flatMap(savedDatasource -> this.organiseDatasourceStorages(savedDatasource)
                .flatMap(datasourceStorageX -> setAdditionalMetadataInDatasourceStorage(datasourceStorageX)
                        .flatMap(datasourceStorage -> {
                            // Make sure that we are creating entries only if the id is not already populated
                            if (hasText(datasourceStorage.getId())) {
                                return Mono.just(datasourceStorage);
                            }

                            return datasourceStorageService
                                    .create(datasourceStorage, isDryOps)
                                    .map(datasourceStorage1 -> {
                                        if (datasourceStorageDryRunQueries != null && isDryOps) {
                                            List<DatasourceStorage> datasourceStorages =
                                                    datasourceStorageDryRunQueries.get(SAVE);
                                            if (datasourceStorages == null) {
                                                datasourceStorages = new ArrayList<>();
                                            }
                                            datasourceStorages.add(datasourceStorage1);
                                            datasourceStorageDryRunQueries.put(SAVE, datasourceStorages);
                                        }
                                        return datasourceStorage1;
                                    });
                        }))
                .map(datasourceStorageService::createDatasourceStorageDTOFromDatasourceStorage)
                .collectMap(DatasourceStorageDTO::getEnvironmentId)
                .map(savedStorages -> {
                    savedDatasource.setDatasourceStorages(savedStorages);
                    return savedDatasource;
                }));
    }

    private Mono<DatasourceStorage> setAdditionalMetadataInDatasourceStorage(DatasourceStorage datasourceStorage) {
        Mono<String> organizationIdMono = organizationService.getCurrentUserOrganizationId();
        Mono<String> instanceIdMono = configService.getInstanceId();

        Map<String, Object> metadata = new HashMap<>();

        return organizationIdMono.zipWith(instanceIdMono).map(tuple -> {
            metadata.put(TENANT_ID, tuple.getT1());
            metadata.put(INSTANCE_ID, tuple.getT2());
            datasourceStorage.setMetadata(metadata);
            return datasourceStorage;
        });
    }

    // this requires an EE override multiple environments
    protected Flux<DatasourceStorage> organiseDatasourceStorages(@NotNull Datasource savedDatasource) {
        Map<String, DatasourceStorageDTO> storages = savedDatasource.getDatasourceStorages();
        int datasourceStorageDTOsAllowed = 1;
        if (storages.size() > datasourceStorageDTOsAllowed) {
            // ideally an error should be thrown; however, since datasource has already been created, it needs be
            // returned.
            log.debug(
                    "datasource has got {} configurations, which is more than: {} for datasourceId: {}",
                    storages.size(),
                    datasourceStorageDTOsAllowed,
                    savedDatasource.getId());
        }

        Map<String, DatasourceStorage> storagesToBeSaved = new HashMap<>();

        return Flux.fromIterable(storages.values())
                .flatMap(datasourceStorageDTO -> this.getTrueEnvironmentId(
                                savedDatasource.getWorkspaceId(),
                                datasourceStorageDTO.getEnvironmentId(),
                                savedDatasource.getPluginId(),
                                null)
                        .map(trueEnvironmentId -> {
                            datasourceStorageDTO.setEnvironmentId(trueEnvironmentId);
                            DatasourceStorage datasourceStorage =
                                    datasourceStorageService.createDatasourceStorageFromDatasourceStorageDTO(
                                            datasourceStorageDTO);
                            datasourceStorage.prepareTransientFields(savedDatasource);
                            storagesToBeSaved.put(trueEnvironmentId, datasourceStorage);
                            return datasourceStorage;
                        }))
                .thenMany(Flux.fromIterable(storagesToBeSaved.values()));
    }

    private Mono<Datasource> generateAndSetDatasourcePolicies(
            Mono<User> userMono, Datasource datasource, AclPermission permission) {
        return userMono.flatMap(user -> {
            Mono<Workspace> workspaceMono = workspaceService
                    .findById(datasource.getWorkspaceId(), permission)
                    .log()
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, datasource.getWorkspaceId())));

            return workspaceMono.map(workspace -> {
                Set<Policy> documentPolicies =
                        policyGenerator.getAllChildPolicies(workspace.getPolicies(), Workspace.class, Datasource.class);
                datasource.setPolicies(documentPolicies);
                return datasource;
            });
        });
    }

    @Override
    public Mono<Datasource> updateDatasource(
            String id, Datasource datasource, String activeEnvironmentId, Boolean isUserRefreshedUpdate) {
        if (!hasText(id)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        // Since policies are a server only concept, first set the empty set (set by constructor) to null
        datasource.setPolicies(null);
        // this is important to avoid polluting the collection with configuration when we are saving the datasource
        // check method docstring for description
        datasource.nullifyStorageReplicaFields();

        Mono<Datasource> datasourceMono = repository
                .findById(id, datasourcePermission.getEditPermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)));

        // This is meant to be an update for just the datasource - like a renamed
        return datasourceMono
                .map(datasourceInDb -> {
                    copyNestedNonNullProperties(datasource, datasourceInDb);
                    return datasourceInDb;
                })
                .flatMap(datasourceInDb -> validateAndSaveDatasourceToRepository(datasourceInDb, false))
                .map(savedDatasource -> {
                    // not required by client side in order to avoid updating it to a null storage,
                    // one alternative is that we find and send datasourceStorages along, but that is an expensive call
                    savedDatasource.setDatasourceStorages(null);
                    return savedDatasource;
                })
                .flatMap(savedDatasource -> {
                    Map<String, Object> analyticsProperties = getAnalyticsProperties(savedDatasource);
                    Boolean userInvokedUpdate = TRUE.equals(isUserRefreshedUpdate) ? TRUE : FALSE;
                    analyticsProperties.put(FieldName.IS_DATASOURCE_UPDATE_USER_INVOKED_KEY, userInvokedUpdate);
                    return analyticsService.sendUpdateEvent(savedDatasource, analyticsProperties);
                });
    }

    @Override
    public Mono<Datasource> updateDatasourceStorage(
            @NotNull DatasourceStorageDTO datasourceStorageDTO,
            String activeEnvironmentId,
            Boolean isUserRefreshedUpdate) {

        String datasourceId = datasourceStorageDTO.getDatasourceId();
        String environmentId = datasourceStorageDTO.getEnvironmentId();

        if (!hasText(datasourceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.DATASOURCE_ID));
        }

        if (!hasText(environmentId)) {
            // ideally the error would be thrown, but we would only throw error when complete client side changes
            // have been done for multiple-environments. For now this call will go through
            log.debug("environmentId not found while updating datasource storage with datasourceId : {}", datasourceId);
        }

        // querying for each of the datasource
        Mono<Datasource> datasourceMonoCached = findById(datasourceId, datasourcePermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)));

        Mono<String> trueEnvironmentIdMono = datasourceMonoCached.flatMap(datasource ->
                getTrueEnvironmentId(datasource.getWorkspaceId(), environmentId, datasource.getPluginId(), null));

        return datasourceMonoCached.zipWith(trueEnvironmentIdMono).flatMap(tuple2 -> {
            Datasource dbDatasource = tuple2.getT1();
            String trueEnvironmentId = tuple2.getT2();

            datasourceStorageDTO.setEnvironmentId(trueEnvironmentId);
            DatasourceStorage datasourceStorage =
                    datasourceStorageService.createDatasourceStorageFromDatasourceStorageDTO(datasourceStorageDTO);
            datasourceStorage.prepareTransientFields(dbDatasource);

            return datasourceStorageService
                    .updateDatasourceStorage(datasourceStorage, activeEnvironmentId, Boolean.TRUE, false)
                    .map(datasourceStorageService::createDatasourceStorageDTOFromDatasourceStorage)
                    .map(datasourceStorageDTO1 -> {
                        dbDatasource.getDatasourceStorages().put(trueEnvironmentId, datasourceStorageDTO1);
                        return dbDatasource;
                    });
        });
    }

    @Override
    public Mono<Datasource> save(Datasource datasource, boolean isDryOps) {
        if (datasource.getGitSyncId() == null) {
            datasource.setGitSyncId(
                    datasource.getWorkspaceId() + "_" + Instant.now().toString());
        }
        if (isDryOps) {
            datasource.updateForBulkWriteOperation();
            return Mono.just(datasource);
        }
        return repository.save(datasource);
    }

    private Mono<Datasource> validateAndSaveDatasourceToRepository(Datasource datasource, boolean isDryOps) {

        return Mono.just(datasource)
                .flatMap(this::validateDatasource)
                .flatMap(unsavedDatasource -> {
                    Mono<Datasource> datasourceMono;
                    if (isDryOps) {
                        unsavedDatasource.updateForBulkWriteOperation();
                        datasourceMono = Mono.just(unsavedDatasource);
                    } else {
                        datasourceMono = repository.save(unsavedDatasource);
                    }
                    return datasourceMono.map(savedDatasource -> {
                        // datasource.pluginName is a transient field. It was set by validateDatasource method
                        // object from db will have pluginName=null so set it manually from the unsaved datasource obj
                        savedDatasource.setPluginName(unsavedDatasource.getPluginName());
                        return savedDatasource;
                    });
                })
                .flatMap(repository::setUserPermissionsInObject);
    }

    @Override
    public Mono<Datasource> validateDatasource(Datasource datasource) {
        Set<String> invalids = new HashSet<>();
        datasource.setInvalids(invalids);

        if (!StringUtils.hasText(datasource.getName())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (datasource.getPluginId() == null) {
            invalids.add(AppsmithError.PLUGIN_ID_NOT_GIVEN.getMessage());
            return Mono.just(datasource);
        }

        if (datasource.getWorkspaceId() == null) {
            invalids.add(AppsmithError.WORKSPACE_ID_NOT_GIVEN.getMessage());
            return Mono.just(datasource);
        }

        Mono<Workspace> checkPluginInstallationAndThenReturnWorkspaceMono = workspaceService
                .findByIdAndPluginsPluginId(datasource.getWorkspaceId(), datasource.getPluginId())
                .switchIfEmpty(Mono.defer(() -> {
                    invalids.add(AppsmithError.PLUGIN_NOT_INSTALLED.getMessage(datasource.getPluginId()));
                    return Mono.just(new Workspace());
                }));
        final Mono<Plugin> pluginMono =
                pluginService.findById(datasource.getPluginId()).cache();
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper
                .getPluginExecutor(pluginMono)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())));

        return checkPluginInstallationAndThenReturnWorkspaceMono
                .then(pluginExecutorMono)
                .flatMap(pluginExecutor -> {
                    return pluginMono.map(plugin -> {
                        // setting the plugin name to datasource.
                        // this is required in analytics events for datasource e.g. create ds, update ds
                        datasource.setPluginName(plugin.getName());
                        return datasource;
                    });
                });
    }

    /**
     * This function can now only be used if you send the entire datasource object and not just id inside the datasource object. We only fetch
     * the password from the db if its a saved datasource before testing.
     */
    @Override
    public Mono<DatasourceTestResult> testDatasource(
            DatasourceStorageDTO datasourceStorageDTO, String activeEnvironmentId) {
        DatasourceStorage datasourceStorage =
                datasourceStorageService.createDatasourceStorageFromDatasourceStorageDTO(datasourceStorageDTO);
        return this.isEndpointBlockedForConnectionRequest(datasourceStorage).flatMap(isBlocked -> {
            if (!isBlocked) {
                final Mono<DatasourceStorage> datasourceStorageMono;

                // Ideally there should also be a check for missing environmentId,
                // however since we are falling back to default this step is not required here.

                // Cases where the datasource hasn't been saved yet
                if (!hasText(datasourceStorage.getDatasourceId())) {

                    if (!hasText(datasourceStorage.getWorkspaceId())) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
                    }

                    datasourceStorageMono = getTrueEnvironmentId(
                                    datasourceStorage.getWorkspaceId(),
                                    datasourceStorage.getEnvironmentId(),
                                    datasourceStorage.getPluginId(),
                                    null)
                            .map(trueEnvironmentId -> {
                                datasourceStorage.setEnvironmentId(trueEnvironmentId);
                                return datasourceStorage;
                            });
                } else {

                    datasourceStorageMono = findById(
                                    datasourceStorage.getDatasourceId(), datasourcePermission.getExecutePermission())
                            .zipWhen(dbDatasource -> getTrueEnvironmentId(
                                    dbDatasource.getWorkspaceId(),
                                    datasourceStorage.getEnvironmentId(),
                                    dbDatasource.getPluginId(),
                                    null))
                            .flatMap(tuple2 -> {
                                Datasource datasource = tuple2.getT1();
                                String trueEnvironmentId = tuple2.getT2();

                                datasourceStorage.setEnvironmentId(trueEnvironmentId);
                                datasourceStorage.prepareTransientFields(datasource);
                                return Mono.zip(Mono.just(datasource), Mono.just(datasourceStorage));
                            })
                            .flatMap(tuple2 -> {
                                Datasource datasource = tuple2.getT1();
                                DatasourceStorage datasourceStorage1 = tuple2.getT2();
                                DatasourceConfiguration datasourceConfiguration =
                                        datasourceStorage1.getDatasourceConfiguration();
                                if (datasourceConfiguration == null
                                        || datasourceConfiguration.getAuthentication() == null) {
                                    return Mono.just(datasourceStorage);
                                }

                                String trueEnvironmentId = datasourceStorage1.getEnvironmentId();
                                // Fetch any fields that maybe encrypted from the db if the datasource being tested does
                                // not have those fields set.
                                // This scenario would happen whenever an existing datasource is being tested and no
                                // changes are present in the encrypted field, because encrypted fields are not sent
                                // over the network after encryption back to the client

                                if (!hasText(datasourceStorage.getId())) {
                                    return Mono.just(datasourceStorage);
                                }

                                return datasourceStorageService
                                        .findByDatasourceAndEnvironmentIdForExecution(datasource, trueEnvironmentId)
                                        .map(dbDatasourceStorage -> {
                                            copyNestedNonNullProperties(datasourceStorage, dbDatasourceStorage);
                                            return dbDatasourceStorage;
                                        })
                                        .switchIfEmpty(Mono.just(datasourceStorage));
                            })
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)));
                }
                return datasourceStorageMono
                        .flatMap(datasourceStorageService::checkEnvironment)
                        .flatMap(this::verifyDatasourceAndTest);
            } else {
                return Mono.just(new DatasourceTestResult(TOO_MANY_REQUESTS_EXCEPTION.getMessage()));
            }
        });
    }

    protected Mono<DatasourceTestResult> verifyDatasourceAndTest(DatasourceStorage datasourceStorage) {
        return Mono.justOrEmpty(datasourceStorage)
                .flatMap(datasourceStorageService::validateDatasourceConfiguration)
                .zipWith(datasourceStorageService.getEnvironmentNameFromEnvironmentIdForAnalytics(
                        datasourceStorage.getEnvironmentId()))
                .flatMap(tuple2 -> {
                    DatasourceStorage storage = tuple2.getT1();
                    String environmentName = tuple2.getT2();
                    Mono<DatasourceTestResult> datasourceTestResultMono;
                    if (CollectionUtils.isEmpty(storage.getInvalids())) {
                        datasourceTestResultMono = testDatasourceViaPlugin(storage);
                    } else {
                        datasourceTestResultMono = Mono.just(new DatasourceTestResult(storage.getInvalids()));
                    }

                    return datasourceTestResultMono
                            .flatMap(datasourceTestResult -> {
                                if (!CollectionUtils.isEmpty(datasourceTestResult.getInvalids())) {
                                    // Consumes a token from bucket whenever test api fails
                                    return this.consumeTokenIfAvailable(datasourceStorage)
                                            .flatMap(wasTokenAvailable -> {
                                                if (!wasTokenAvailable) {
                                                    DatasourceTestResult tooManyRequests = new DatasourceTestResult(
                                                            TOO_MANY_REQUESTS_EXCEPTION.getMessage());

                                                    // This will block the test API for next 5 minutes, as bucket has
                                                    // been exhausted, and return too many requests response
                                                    return this.blockEndpointForConnectionRequest(datasourceStorage)
                                                            .flatMap(isAdded -> {
                                                                if (isAdded) {
                                                                    return Mono.just(tooManyRequests);
                                                                } else {
                                                                    return Mono.just(new DatasourceTestResult(
                                                                            new AppsmithException(
                                                                                            AppsmithError
                                                                                                    .DATASOURCE_CONNECTION_RATE_LIMIT_BLOCKING_FAILED)
                                                                                    .getMessage()));
                                                                }
                                                            })
                                                            .onErrorResume(error -> Mono.just(
                                                                    new DatasourceTestResult(error.getMessage())));
                                                }
                                                return Mono.just(datasourceTestResult);
                                            })
                                            .flatMap(datasourceTestResult1 -> {
                                                return analyticsService
                                                        .sendObjectEvent(
                                                                AnalyticsEvents.DS_TEST_EVENT_FAILED,
                                                                datasourceStorage,
                                                                getAnalyticsPropertiesForTestEventStatus(
                                                                        datasourceStorage,
                                                                        datasourceTestResult1,
                                                                        environmentName))
                                                        .thenReturn(datasourceTestResult1);
                                            });
                                } else {
                                    return analyticsService
                                            .sendObjectEvent(
                                                    AnalyticsEvents.DS_TEST_EVENT_SUCCESS,
                                                    datasourceStorage,
                                                    getAnalyticsPropertiesForTestEventStatus(
                                                            datasourceStorage, datasourceTestResult, environmentName))
                                            .thenReturn(datasourceTestResult);
                                }
                            })
                            .map(datasourceTestResult -> {
                                datasourceTestResult.setMessages(storage.getMessages());
                                return datasourceTestResult;
                            });
                });
    }

    protected Mono<DatasourceTestResult> testDatasourceViaPlugin(DatasourceStorage datasourceStorage) {
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper
                .getPluginExecutor(pluginService.findById(datasourceStorage.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())));

        // Feature flagging implementation is added here as a potential fix to dynamoDB query timeouts problem
        // This is a temporary fix and will be removed once we get the confirmation from the user that issue is resolved
        // Even if the issue is not resolved, we will know that fix does not work and hence will be removing the code in
        // any case
        // https://github.com/appsmithorg/appsmith/issues/39426 Created task here to remove this flag
        // This implementation ensures that none of the existing plugins have any impact due to feature flagging, hence
        // if else condition
        return featureFlagService
                .check(FeatureFlagEnum.release_dynamodb_connection_time_to_live_enabled)
                .flatMap(isDynamoDBConnectionTimeToLiveEnabled -> {
                    if (isDynamoDBConnectionTimeToLiveEnabled) {
                        return pluginExecutorMono.flatMap(pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor)
                                .testDatasource(datasourceStorage.getDatasourceConfiguration(), true));
                    } else {
                        return pluginExecutorMono.flatMap(pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor)
                                .testDatasource(datasourceStorage.getDatasourceConfiguration()));
                    }
                });
    }

    /*
     * This method returns rate limit identifier required in order to apply rate limit on datasource test api
     * and will also be used for creating connections during query execution.
     * For more details: https://github.com/appsmithorg/appsmith/issues/22868
     */
    @Override
    public Mono<String> getRateLimitIdentifier(DatasourceStorage datasourceStorage) {
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper
                .getPluginExecutor(pluginService.findById(datasourceStorage.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())));

        return pluginExecutorMono.flatMap(pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor)
                .getEndpointIdentifierForRateLimit(datasourceStorage.getDatasourceConfiguration()));
    }

    /*
     * This method checks if the given endpoint is blocked for connection request or not.
     */
    @Override
    public Mono<Boolean> isEndpointBlockedForConnectionRequest(DatasourceStorage datasourceStorage) {
        Mono<String> rateLimitIdentifierMono = this.getRateLimitIdentifier(datasourceStorage);
        return featureFlagService
                .check(FeatureFlagEnum.rollout_datasource_test_rate_limit_enabled)
                .zipWith(rateLimitIdentifierMono)
                .flatMap(tuple -> {
                    Boolean isFlagEnabled = tuple.getT1();
                    String rateLimitIdentifier = tuple.getT2();
                    // In case of endpoint identifier as empty string, no rate limiting will be applied
                    // Currently this function is overridden only by postgresPlugin class, in future it will be done for
                    // all plugins wherever applicable.
                    if (isFlagEnabled && Boolean.FALSE.equals(isBlank(rateLimitIdentifier))) {
                        return rateLimitService.isEndpointBlockedForConnectionRequest(
                                RateLimitConstants.BUCKET_KEY_FOR_TEST_DATASOURCE_API, rateLimitIdentifier);
                    } else {
                        return Mono.just(false);
                    }
                });
    }

    /*
     * This method consumes a token from bucket if available, otherwise returns false.
     */
    @Override
    public Mono<Boolean> consumeTokenIfAvailable(DatasourceStorage datasourceStorage) {
        Mono<String> rateLimitIdentifierMono = this.getRateLimitIdentifier(datasourceStorage);
        return featureFlagService
                .check(FeatureFlagEnum.rollout_datasource_test_rate_limit_enabled)
                .zipWith(rateLimitIdentifierMono)
                .flatMap(tuple -> {
                    Boolean isFlagEnabled = tuple.getT1();
                    String rateLimitIdentifier = tuple.getT2();
                    // In case of endpoint identifier as empty string, no rate limiting will be applied
                    // Currently this function is overridden only by postgresPlugin class, in future it will be done for
                    // all plugins wherever applicable.
                    if (isFlagEnabled && Boolean.FALSE.equals(isBlank(rateLimitIdentifier))) {
                        return rateLimitService.tryIncreaseCounter(
                                RateLimitConstants.BUCKET_KEY_FOR_TEST_DATASOURCE_API, rateLimitIdentifier);
                    } else {
                        return Mono.just(true);
                    }
                });
    }

    @Override
    public Mono<Boolean> blockEndpointForConnectionRequest(DatasourceStorage datasourceStorage) {
        Mono<String> rateLimitIdentifierMono = this.getRateLimitIdentifier(datasourceStorage);
        return rateLimitIdentifierMono.flatMap(rateLimitIdentifier -> {
            return rateLimitService.blockEndpointForConnectionRequest(
                    RateLimitConstants.BUCKET_KEY_FOR_TEST_DATASOURCE_API,
                    rateLimitIdentifier,
                    Duration.ofMinutes(BLOCK_TEST_API_DURATION),
                    TOO_MANY_REQUESTS_EXCEPTION);
        });
    }

    @Override
    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission permission) {
        return repository.findByNameAndWorkspaceId(name, workspaceId, permission);
    }

    @Override
    public Mono<Datasource> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<Datasource> findByIdWithStorages(String id) {
        return repository.findById(id).flatMap(datasource -> {
            return datasourceStorageService
                    .findByDatasource(datasource)
                    .map(datasourceStorageService::createDatasourceStorageDTOFromDatasourceStorage)
                    .collectMap(DatasourceStorageDTO::getEnvironmentId)
                    .map(storages -> {
                        datasource.setDatasourceStorages(storages);
                        return datasource;
                    });
        });
    }

    @Override
    public Mono<Datasource> findByIdAndEnvironmentId(String id, String environmentId) {
        return repository.findById(id).flatMap(datasource -> {
            return datasourceStorageService
                    .findByDatasourceAndEnvironmentId(datasource, environmentId)
                    .map(storage -> {
                        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                        storages.put(
                                environmentId,
                                datasourceStorageService.createDatasourceStorageDTOFromDatasourceStorage(storage));
                        datasource.setDatasourceStorages(storages);
                        return datasource;
                    });
        });
    }

    @Override
    public Mono<Datasource> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Mono<Set<MustacheBindingToken>> extractKeysFromDatasource(Datasource datasource) {

        if (datasource == null) {
            return Mono.just(new HashSet<>());
        }

        if (!StringUtils.hasText(datasource.getId())
                || !StringUtils.hasText(datasource.getPluginId())
                || !StringUtils.hasText(datasource.getWorkspaceId())) {
            return Mono.just(new HashSet<>());
        }

        // for RestAPI and Graphql plugin Type, there is a use case where custom header is required to be
        // a moustache binding, Datasource binding evaluation has been enabled only to satisfy that use case.
        return pluginService.findById(datasource.getPluginId()).flatMap(plugin -> {
            if (plugin.getType() != PluginType.API) {
                return Mono.just(new HashSet<>());
            }

            return datasourceStorageService
                    .getBindingTokensForDatasourceStorages(datasource)
                    .collectList()
                    .map(mustacheBindingTokensList -> {
                        Set<MustacheBindingToken> bindingTokens = new HashSet<>();
                        mustacheBindingTokensList.forEach(mustacheBindingTokens -> {
                            if (mustacheBindingTokens != null) {
                                bindingTokens.addAll(mustacheBindingTokens);
                            }
                        });

                        return bindingTokens;
                    });
        });
    }

    @Override
    public Flux<Datasource> getAllWithStorages(MultiValueMap<String, String> params) {
        String workspaceId = params.getFirst(Datasource.Fields.workspaceId);
        if (workspaceId != null) {
            return this.getAllByWorkspaceIdWithStorages(workspaceId, datasourcePermission.getReadPermission());
        }

        return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
    }

    @Override
    public Flux<Datasource> getAllByWorkspaceIdWithStorages(String workspaceId, AclPermission permission) {
        Mono<Map<String, Plugin>> pluginsMapMono = pluginService
                .findAllPluginsInWorkspace(workspaceId)
                .name(FETCH_ALL_PLUGINS_IN_WORKSPACE)
                .tap(Micrometer.observation(observationRegistry));

        return pluginsMapMono.flatMapMany(pluginsMap -> repository
                .findAllByWorkspaceId(workspaceId, permission)
                .publishOn(Schedulers.boundedElastic())
                .flatMap(datasource -> datasourceStorageService
                        .findByDatasource(datasource)
                        .publishOn(Schedulers.boundedElastic())
                        .flatMap(datasourceStorage ->
                                datasourceStorageService.populateHintMessages(datasourceStorage, pluginsMap))
                        .map(datasourceStorageService::createDatasourceStorageDTOFromDatasourceStorage)
                        .collectMap(DatasourceStorageDTO::getEnvironmentId)
                        .flatMap(datasourceStorages -> {
                            datasource.setDatasourceStorages(datasourceStorages);
                            return Mono.just(datasource);
                        }))
                .collectList()
                .name(FETCH_ALL_DATASOURCES_WITH_STORAGES)
                .tap(Micrometer.observation(observationRegistry))
                .flatMapMany(datasourceList -> {
                    markRecentlyUsed(datasourceList, 3);
                    return Flux.fromIterable(datasourceList);
                }));
    }

    @Override
    public Mono<Datasource> archiveById(String id) {
        return datasourcePermission
                .getDeletePermission()
                .flatMap(permission -> repository.findById(id, permission))
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)))
                .zipWhen(datasource -> newActionRepository.countByDatasourceId(datasource.getId()))
                .flatMap(objects -> {
                    final Long actionsCount = objects.getT2();
                    if (actionsCount > 0) {
                        String queryWord = actionsCount == 1 ? "query" : "queries";
                        return Mono.error(
                                new AppsmithException(AppsmithError.DATASOURCE_HAS_ACTIONS, actionsCount, queryWord));
                    }
                    return Mono.just(objects.getT1());
                })
                .flatMap(toDelete -> {
                    return datasourceStorageService
                            .findStrictlyByDatasourceId(toDelete.getId())
                            .publishOn(Schedulers.boundedElastic())
                            .map(datasourceStorage -> {
                                datasourceStorage.prepareTransientFields(toDelete);
                                return datasourceStorage;
                            })
                            .flatMap(datasourceStorage -> {
                                return datasourceContextService
                                        .deleteDatasourceContext(datasourceStorage)
                                        .then(datasourceStorageService.archive(datasourceStorage));
                            })
                            .flatMap(datasourceStorage -> {
                                if (!StringUtils.hasText(toDelete.getPluginId())) {
                                    log.error("Plugin id is missing in datasource, skipping pre-delete hook execution");
                                    return Mono.just(datasourceStorage);
                                }
                                Mono<PluginExecutor> pluginExecutorMono = findPluginExecutor(toDelete.getPluginId());
                                return pluginExecutorMono
                                        .flatMap(pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor)
                                                .preDeleteHook(datasourceStorage))
                                        .onErrorResume(error -> {
                                            log.error("Error occurred while executing after delete hook", error);
                                            return Mono.just(datasourceStorage);
                                        });
                            })
                            .then(repository.archive(toDelete))
                            .thenReturn(toDelete);
                })
                .flatMap(datasource -> {
                    Map<String, String> eventData = Map.of(FieldName.WORKSPACE_ID, datasource.getWorkspaceId());
                    Map<String, Object> analyticsProperties = getAnalyticsProperties(datasource);
                    analyticsProperties.put(FieldName.EVENT_DATA, eventData);
                    return analyticsService.sendDeleteEvent(datasource, analyticsProperties);
                });
    }

    @Override
    public Flux<Datasource> saveAll(List<Datasource> datasourceList) {
        datasourceList.stream()
                .filter(datasource -> datasource.getGitSyncId() == null)
                .forEach(datasource -> datasource.setGitSyncId(
                        datasource.getWorkspaceId() + "_" + Instant.now().toString()));
        return repository.saveAll(datasourceList);
    }

    private Mono<PluginExecutor> findPluginExecutor(String pluginId) {
        final Mono<Plugin> pluginMono = pluginService.findById(pluginId).cache();
        return pluginExecutorHelper
                .getPluginExecutor(pluginMono)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, pluginId)));
    }

    /**
     * Sets isRecentlyCreated flag to the datasources that were created recently.
     * It finds the most recent `recentlyUsedCount` numbers of datasources based on the `createdAt` field and set
     * the flag on for them.
     *
     * @param datasourceList    List datasources
     * @param recentlyUsedCount How many should be marked as recently created
     */
    private void markRecentlyUsed(List<Datasource> datasourceList, int recentlyUsedCount) {
        if (CollectionUtils.isEmpty(datasourceList)) { // list is null or empty, nothing to do
            return;
        }

        // Here are the steps that we're following here:
        // 1. Put the index of each datasource and the createdDate into a list of Tuple2<Integer, Instant>
        // 2. Sort that list based on createdDate in descending order
        // 3. Take first `recentlyUsedCount` numbers of Tuple2 from the list
        // 4. Fetch corresponding datasource using the index of Tuple2 and set the recentlyUsed=true

        List<Tuple2<Integer, Instant>> indexAndCreatedDates = new ArrayList<>(datasourceList.size());

        for (int i = 0; i < datasourceList.size(); i++) {
            Datasource datasource = datasourceList.get(i);
            indexAndCreatedDates.add(Tuples.of(i, datasource.getCreatedAt()));
        }

        // provide a comparator to sort Tuple2<Integer, Instant> in reversed order of Instant
        indexAndCreatedDates.sort(Comparator.comparing(Tuple2::getT2, Comparator.reverseOrder()));

        // set the flag based on indexes from indexAndCreatedDates
        for (int i = 0; i < recentlyUsedCount && i < indexAndCreatedDates.size(); i++) {
            Tuple2<Integer, Instant> objects = indexAndCreatedDates.get(i);
            Datasource datasource = datasourceList.get(objects.getT1());
            datasource.setIsRecentlyCreated(true);
        }
    }

    @Override
    public Mono<String> getTrueEnvironmentId(
            String workspaceId, String environmentId, String pluginId, AclPermission aclPermission) {
        return this.getTrueEnvironmentId(workspaceId, environmentId, pluginId, aclPermission, false);
    }

    @Override
    public Mono<String> getTrueEnvironmentId(
            String workspaceId,
            String environmentId,
            String pluginId,
            AclPermission aclPermission,
            boolean isEmbedded) {
        return Mono.just(FieldName.UNUSED_ENVIRONMENT_ID);
    }

    @Override
    public Datasource createDatasourceFromDatasourceStorage(DatasourceStorage datasourceStorage) {
        Datasource datasource = new Datasource();
        datasource.setId(datasourceStorage.getDatasourceId());
        datasource.setName(datasourceStorage.getName());
        datasource.setPluginId(datasourceStorage.getPluginId());
        datasource.setPluginName(datasourceStorage.getPluginName());
        datasource.setWorkspaceId(datasourceStorage.getWorkspaceId());
        datasource.setTemplateName(datasourceStorage.getTemplateName());
        datasource.setIsAutoGenerated(datasourceStorage.getIsAutoGenerated());
        datasource.setIsRecentlyCreated(datasourceStorage.getIsRecentlyCreated());
        datasource.setIsTemplate(datasourceStorage.getIsTemplate());
        datasource.setIsMock(datasourceStorage.getIsMock());
        datasource.setGitSyncId(datasourceStorage.getGitSyncId());

        if (hasText(datasourceStorage.getEnvironmentId())) {
            datasource
                    .getDatasourceStorages()
                    .put(
                            datasourceStorage.getEnvironmentId(),
                            datasourceStorageService.createDatasourceStorageDTOFromDatasourceStorage(
                                    datasourceStorage));
        }

        return datasource;
    }
}
