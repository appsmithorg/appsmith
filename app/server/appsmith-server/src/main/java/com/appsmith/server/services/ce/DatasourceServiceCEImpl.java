package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceDTO;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QDatasource;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceStorageService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.SequenceService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.WorkspacePermission;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.CollectionUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.helpers.CollectionUtils.isNullOrEmpty;
import static com.appsmith.server.helpers.DatasourceAnalyticsUtils.getAnalyticsPropertiesForTestEventStatus;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.springframework.util.StringUtils.hasText;

@Slf4j
public class DatasourceServiceCEImpl implements DatasourceServiceCE {

    private final DatasourceRepository repository;
    private final WorkspaceService workspaceService;
    private final SessionUserService sessionUserService;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final PolicyGenerator policyGenerator;
    private final SequenceService sequenceService;
    private final NewActionRepository newActionRepository;
    private final DatasourceContextService datasourceContextService;
    private final DatasourcePermission datasourcePermission;
    private final WorkspacePermission workspacePermission;
    private final DatasourceStorageService datasourceStorageService;
    private final AnalyticsService analyticsService;

    @Autowired
    public DatasourceServiceCEImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
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
            DatasourceStorageService datasourceStorageService) {

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
    }

    @Override
    public Mono<Datasource> create(Datasource datasource) {
        return createEx(datasource, Optional.of(workspacePermission.getDatasourceCreatePermission()));
    }

    // TODO: Check usage
    @Override
    public Mono<Datasource> createWithoutPermissions(Datasource datasource) {
        return createEx(datasource, Optional.empty());
    }

    private Mono<Datasource> createEx(@NotNull Datasource datasource, Optional<AclPermission> permission) {
        // Validate incoming request
        String workspaceId = datasource.getWorkspaceId();
        if (!hasText(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }
        if (!hasText(datasource.getPluginId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PLUGIN_ID));
        }
        if (!hasText(datasource.getGitSyncId())) {
            datasource.setGitSyncId(datasource.getWorkspaceId() + "_" + new ObjectId());
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
                    .flatMap(this::validateAndSaveDatasourceToRepository)
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
                .flatMap(datasourceStorage -> {
                    // Make sure that we are creating entries only if the id is not already populated
                    if (datasourceStorage.getId() == null) {
                        return datasourceStorageService.create(datasourceStorage);
                    }
                    return Mono.just(datasourceStorage);
                })
                .map(DatasourceStorageDTO::new)
                .collectMap(DatasourceStorageDTO::getEnvironmentId)
                .map(savedStorages -> {
                    savedDatasource.setDatasourceStorages(savedStorages);
                    return savedDatasource;
                }));
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
                                savedDatasource.getWorkspaceId(), datasourceStorageDTO.getEnvironmentId())
                        .map(trueEnvironmentId -> {
                            datasourceStorageDTO.setEnvironmentId(trueEnvironmentId);
                            DatasourceStorage datasourceStorage = new DatasourceStorage(datasourceStorageDTO);
                            datasourceStorage.prepareTransientFields(savedDatasource);
                            storagesToBeSaved.put(trueEnvironmentId, datasourceStorage);
                            return datasourceStorage;
                        }))
                .thenMany(Flux.fromIterable(storagesToBeSaved.values()));
    }

    private Mono<Datasource> generateAndSetDatasourcePolicies(
            Mono<User> userMono, Datasource datasource, Optional<AclPermission> permission) {
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

        // This is meant to be an update for just the datasource - like a rename
        return datasourceMono
                .map(dbDatasource -> {
                    copyNestedNonNullProperties(datasource, dbDatasource);
                    return dbDatasource;
                })
                .flatMap(this::validateAndSaveDatasourceToRepository)
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

        Mono<String> trueEnvironmentIdMono = datasourceMonoCached.flatMap(
                datasource -> getTrueEnvironmentId(datasource.getWorkspaceId(), environmentId));

        return datasourceMonoCached.zipWith(trueEnvironmentIdMono).flatMap(tuple2 -> {
            Datasource dbDatasource = tuple2.getT1();
            String trueEnvironmentId = tuple2.getT2();

            datasourceStorageDTO.setEnvironmentId(trueEnvironmentId);
            DatasourceStorage datasourceStorage = new DatasourceStorage(datasourceStorageDTO);
            datasourceStorage.prepareTransientFields(dbDatasource);

            return datasourceStorageService
                    .updateDatasourceStorage(datasourceStorage, activeEnvironmentId, Boolean.TRUE)
                    .map(DatasourceStorageDTO::new)
                    .map(datasourceStorageDTO1 -> {
                        dbDatasource.getDatasourceStorages().put(trueEnvironmentId, datasourceStorageDTO1);
                        return dbDatasource;
                    });
        });
    }

    @Override
    public Mono<Datasource> save(Datasource datasource) {
        if (datasource.getGitSyncId() == null) {
            datasource.setGitSyncId(
                    datasource.getWorkspaceId() + "_" + Instant.now().toString());
        }
        return repository.save(datasource);
    }

    private Mono<Datasource> validateAndSaveDatasourceToRepository(Datasource datasource) {

        return Mono.just(datasource)
                .flatMap(this::validateDatasource)
                .flatMap(unsavedDatasource -> {
                    return repository.save(unsavedDatasource).map(savedDatasource -> {
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

        DatasourceStorage datasourceStorage = new DatasourceStorage(datasourceStorageDTO);
        Mono<DatasourceStorage> datasourceStorageMono;

        // Ideally there should also be a check for missing environmentId,
        // however since we are falling back to default this step is not required here.

        // Cases where the datasource hasn't been saved yet
        if (!hasText(datasourceStorage.getDatasourceId())) {

            if (!hasText(datasourceStorage.getWorkspaceId())) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
            }

            datasourceStorageMono = getTrueEnvironmentId(
                            datasourceStorage.getWorkspaceId(), datasourceStorage.getEnvironmentId())
                    .map(trueEnvironmentId -> {
                        datasourceStorage.setEnvironmentId(trueEnvironmentId);
                        return datasourceStorage;
                    });
        } else {

            datasourceStorageMono = findById(
                            datasourceStorage.getDatasourceId(), datasourcePermission.getExecutePermission())
                    .zipWhen(dbDatasource ->
                            getTrueEnvironmentId(dbDatasource.getWorkspaceId(), datasourceStorage.getEnvironmentId()))
                    .map(tuple2 -> {
                        Datasource datasource = tuple2.getT1();
                        String trueEnvironmentId = tuple2.getT2();

                        datasourceStorage.setEnvironmentId(trueEnvironmentId);
                        datasourceStorage.prepareTransientFields(datasource);
                        return datasourceStorage;
                    })
                    .flatMap(datasourceStorage1 -> {
                        DatasourceConfiguration datasourceConfiguration =
                                datasourceStorage1.getDatasourceConfiguration();
                        if (datasourceConfiguration == null || datasourceConfiguration.getAuthentication() == null) {
                            return Mono.just(datasourceStorage);
                        }

                        String datasourceId = datasourceStorage1.getDatasourceId();
                        String trueEnvironmentId = datasourceStorage1.getEnvironmentId();
                        // Fetch any fields that maybe encrypted from the db if the datasource being tested does not
                        // have those fields set.
                        // This scenario would happen whenever an existing datasource is being tested and no changes are
                        // present in the
                        // encrypted field (because encrypted fields are not sent over the network after encryption back
                        // to the client

                        if (!hasText(datasourceStorage.getId())) {
                            return Mono.just(datasourceStorage);
                        }

                        return datasourceStorageService
                                .findStrictlyByDatasourceIdAndEnvironmentId(datasourceId, trueEnvironmentId)
                                .map(dbDatasourceStorage -> {
                                    copyNestedNonNullProperties(datasourceStorage, dbDatasourceStorage);
                                    return dbDatasourceStorage;
                                });
                    })
                    .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)));
        }

        return datasourceStorageMono
                .flatMap(datasourceStorageService::checkEnvironment)
                .flatMap(this::verifyDatasourceAndTest);
    }

    protected Mono<DatasourceTestResult> verifyDatasourceAndTest(DatasourceStorage datasourceStorage) {
        return Mono.justOrEmpty(datasourceStorage)
                .flatMap(datasourceStorageService::validateDatasourceConfiguration)
                .flatMap(storage -> {
                    Mono<DatasourceTestResult> datasourceTestResultMono;
                    if (CollectionUtils.isEmpty(storage.getInvalids())) {
                        datasourceTestResultMono = testDatasourceViaPlugin(storage);
                    } else {
                        datasourceTestResultMono = Mono.just(new DatasourceTestResult(storage.getInvalids()));
                    }

                    return datasourceTestResultMono
                            .flatMap(datasourceTestResult -> {
                                if (!CollectionUtils.isEmpty(datasourceTestResult.getInvalids())) {
                                    return analyticsService
                                            .sendObjectEvent(
                                                    AnalyticsEvents.DS_TEST_EVENT_FAILED,
                                                    datasourceStorage,
                                                    getAnalyticsPropertiesForTestEventStatus(
                                                            datasourceStorage, datasourceTestResult))
                                            .thenReturn(datasourceTestResult);

                                } else {
                                    return analyticsService
                                            .sendObjectEvent(
                                                    AnalyticsEvents.DS_TEST_EVENT_SUCCESS,
                                                    datasourceStorage,
                                                    getAnalyticsPropertiesForTestEventStatus(
                                                            datasourceStorage, datasourceTestResult))
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

        return pluginExecutorMono.flatMap(pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor)
                .testDatasource(datasourceStorage.getDatasourceConfiguration()));
    }

    @Override
    public Mono<Datasource> findByNameAndWorkspaceId(
            String name, String workspaceId, Optional<AclPermission> permission) {
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
                    .collectMap(
                            datasourceStorage -> datasourceStorage.getEnvironmentId(),
                            datasourceStorage -> new DatasourceStorageDTO(datasourceStorage))
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
                        storages.put(environmentId, new DatasourceStorageDTO(storage));
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
    public Set<MustacheBindingToken> extractKeysFromDatasource(Datasource datasource) {
        if (datasource == null || datasource.getDatasourceConfiguration() == null) {
            return new HashSet<>();
        }

        return MustacheHelper.extractMustacheKeysFromFields(datasource.getDatasourceConfiguration());
    }

    @Override
    public Flux<Datasource> getAllWithStorages(MultiValueMap<String, String> params) {
        String workspaceId = params.getFirst(fieldName(QDatasource.datasource.workspaceId));
        if (workspaceId != null) {
            return this.getAllByWorkspaceIdWithStorages(
                    workspaceId, Optional.of(datasourcePermission.getReadPermission()));
        }

        return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
    }

    @Override
    public Flux<Datasource> getAllByWorkspaceIdWithoutStorages(String workspaceId, Optional<AclPermission> permission) {
        return repository.findAllByWorkspaceId(workspaceId, permission);
    }

    @Override
    public Flux<Datasource> getAllByWorkspaceIdWithStorages(String workspaceId, Optional<AclPermission> permission) {

        return repository
                .findAllByWorkspaceId(workspaceId, permission)
                .publishOn(Schedulers.boundedElastic())
                .flatMap(datasource -> datasourceStorageService
                        .findByDatasource(datasource)
                        .publishOn(Schedulers.boundedElastic())
                        .flatMap(datasourceStorageService::populateHintMessages)
                        .map(DatasourceStorageDTO::new)
                        .collectMap(DatasourceStorageDTO::getEnvironmentId)
                        .flatMap(datasourceStorages -> {
                            datasource.setDatasourceStorages(datasourceStorages);
                            return Mono.just(datasource);
                        }))
                .collectList()
                .flatMapMany(datasourceList -> {
                    markRecentlyUsed(datasourceList, 3);
                    return Flux.fromIterable(datasourceList);
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

    @Override
    public Mono<Datasource> archiveById(String id) {
        return repository
                .findById(id, datasourcePermission.getDeletePermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)))
                .zipWhen(datasource -> newActionRepository.countByDatasourceId(datasource.getId()))
                .flatMap(objects -> {
                    final Long actionsCount = objects.getT2();
                    if (actionsCount > 0) {
                        return Mono.error(new AppsmithException(AppsmithError.DATASOURCE_HAS_ACTIONS, actionsCount));
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
    public Map<String, Object> getAnalyticsProperties(Datasource datasource) {
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put("orgId", datasource.getWorkspaceId());
        analyticsProperties.put("pluginName", datasource.getPluginName());
        analyticsProperties.put("dsName", datasource.getName());
        analyticsProperties.put("dsIsTemplate", ObjectUtils.defaultIfNull(datasource.getIsTemplate(), ""));
        analyticsProperties.put("dsIsMock", ObjectUtils.defaultIfNull(datasource.getIsMock(), ""));
        return analyticsProperties;
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

    // TODO: Remove the following snippet after client side API changes
    @Override
    public Mono<DatasourceDTO> convertToDatasourceDTO(Datasource datasource) {
        DatasourceDTO datasourceDTO = new DatasourceDTO();
        datasourceDTO.setId(datasource.getId());
        datasourceDTO.setUserPermissions(datasource.getUserPermissions());
        datasourceDTO.setName(datasource.getName());
        datasourceDTO.setPluginId(datasource.getPluginId());
        datasourceDTO.setPluginName(datasource.getPluginName());
        datasourceDTO.setWorkspaceId(datasource.getWorkspaceId());

        datasourceDTO.setIsTemplate(datasource.getIsTemplate());
        datasourceDTO.setTemplateName(datasource.getTemplateName());
        datasourceDTO.setIsConfigured(datasource.getIsConfigured());
        datasourceDTO.setIsRecentlyCreated(datasource.getIsRecentlyCreated());
        datasourceDTO.setIsMock(datasource.getIsMock());
        datasourceDTO.setPolicies(datasource.getPolicies());

        return workspaceService
                .getDefaultEnvironmentId(datasource.getWorkspaceId())
                .flatMap(environmentId -> {
                    Map<String, DatasourceStorageDTO> storages = datasource.getDatasourceStorages();
                    if (storages == null) {
                        return Mono.empty();
                    }
                    return Mono.justOrEmpty(storages.get(environmentId));
                })
                .map(datasourceStorageDTO1 -> {
                    datasourceDTO.setDatasourceConfiguration(datasourceStorageDTO1.getDatasourceConfiguration());
                    datasourceDTO.setInvalids(datasourceStorageDTO1.getInvalids());
                    datasourceDTO.setMessages(datasourceStorageDTO1.getMessages());
                    datasourceDTO.setIsConfigured(datasourceStorageDTO1.getIsConfigured());
                    return datasourceDTO;
                })
                .thenReturn(datasourceDTO);
    }

    // TODO: Remove the following snippet after client side API changes
    @Override
    public Mono<Datasource> convertToDatasource(DatasourceDTO datasourceDTO, String environmentId) {
        Datasource datasource = new Datasource();
        datasource.setId(datasourceDTO.getId());
        datasource.setUserPermissions(datasourceDTO.getUserPermissions());
        datasource.setName(datasourceDTO.getName());
        datasource.setPluginId(datasourceDTO.getPluginId());
        datasource.setPluginName(datasourceDTO.getPluginName());
        datasource.setWorkspaceId(datasourceDTO.getWorkspaceId());

        datasource.setIsTemplate(datasourceDTO.getIsTemplate());
        datasource.setTemplateName(datasourceDTO.getTemplateName());
        datasource.setIsConfigured(datasourceDTO.getIsConfigured());
        datasource.setIsRecentlyCreated(datasourceDTO.getIsRecentlyCreated());
        datasource.setIsMock(datasourceDTO.getIsMock());

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        datasource.setDatasourceStorages(storages);

        Mono<String> trueEnvironmentIdMono;

        if (StringUtils.hasText(datasource.getWorkspaceId())) {
            trueEnvironmentIdMono = getTrueEnvironmentId(datasource.getWorkspaceId(), environmentId);
        } else if (StringUtils.hasText(datasource.getId())) {
            trueEnvironmentIdMono = findById(datasource.getId(), datasourcePermission.getReadPermission())
                    .flatMap(datasource1 -> getTrueEnvironmentId(datasource1.getWorkspaceId(), environmentId));
        } else {
            if (!StringUtils.hasText(environmentId)) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_DATASOURCE,
                        FieldName.DATASOURCE,
                        "Please provide valid metadata for datasource object"));
            }

            trueEnvironmentIdMono = Mono.just(environmentId);
        }

        return trueEnvironmentIdMono.map(trueEnvironmentId -> {
            if (datasourceDTO.getDatasourceConfiguration() != null) {
                storages.put(trueEnvironmentId, new DatasourceStorageDTO(datasourceDTO, trueEnvironmentId));
            }

            return datasource;
        });
    }

    @Override
    public Mono<String> getTrueEnvironmentId(String workspaceId, String environmentId) {
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
                    .put(datasourceStorage.getEnvironmentId(), new DatasourceStorageDTO(datasourceStorage));
        }

        return datasource;
    }
}
