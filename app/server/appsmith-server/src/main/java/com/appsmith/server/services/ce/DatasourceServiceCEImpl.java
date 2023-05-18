package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.Datasource;
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
import org.apache.commons.lang3.ObjectUtils;
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
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static org.springframework.util.StringUtils.hasLength;

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
    public DatasourceServiceCEImpl(Scheduler scheduler,
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

    // TODO: Remove the following snippet after client side API changes
    @Override
    public Mono<DatasourceDTO> create(DatasourceDTO datasourceDTO, String environmentId) {
        Datasource datasource = convertToDatasource(datasourceDTO, environmentId);
        return this.create(datasource)
                .map(this::convertToDatasourceDTO);
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
        if (!hasLength(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }
        if (hasLength(datasource.getId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        if (!hasLength(datasource.getPluginId())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PLUGIN_ID));
        }
        if (!hasLength(datasource.getGitSyncId())) {
            datasource.setGitSyncId(datasource.getWorkspaceId() + "_" + new ObjectId());
        }


        if (isNullOrEmpty(datasource.getDatasourceStorages())) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.DATASOURCE));
        }

        Mono<Datasource> datasourceMono = Mono.just(datasource);

        // First check if this is an existing datasource or whether we need to create one
        if (datasource.getId() == null) {
            // We need to create the datasource as well

            // Determine valid name for datasource
            if (!StringUtils.hasLength(datasource.getName())) {
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
                        datasource1.setDatasourceConfiguration(null);
                        datasource1.setHasDatasourceStorage(true);
                        return datasource1;
                    })
                    .flatMap(datasource1 -> {
                        Mono<User> userMono = sessionUserService.getCurrentUser();
                        return generateAndSetDatasourcePolicies(userMono, datasource1, permission);
                    })
                    .flatMap(this::validateAndSaveDatasourceToRepository)
                    .flatMap(savedDatasource ->
                            analyticsService.sendCreateEvent(savedDatasource, getAnalyticsProperties(savedDatasource))
                    );
        }

        return datasourceMono
                .flatMap(datasource1 -> {
                    // In case this was a newly created datasource, we need to update datasource reference first
                    return Flux.fromIterable(datasource.getDatasourceStorages().values())
                            .map(datasourceStorageDTO -> {
                                DatasourceStorage datasourceStorage = new DatasourceStorage(datasourceStorageDTO);
                                datasourceStorage.prepareTransientFields(datasource1);
                                return datasourceStorage;
                            })
                            .flatMap(datasourceStorage -> {
                                // Make sure that we are creating entries only if the id is not already populated
                                if (datasourceStorage.getId() == null) {
                                    return datasourceStorageService.create(datasourceStorage);
                                }
                                return Mono.just(datasourceStorage);
                            })
                            .map(datasourceStorage -> new DatasourceStorageDTO(datasourceStorage))
                            .collectMap(datasourceStorageDTO -> datasourceStorageDTO.getEnvironmentId(),
                                    datasourceStorageDTO -> datasourceStorageDTO)
                            .map(storages -> {
                                datasource1.setDatasourceStorages(storages);
                                return datasource1;
                            });
                });
    }

    private Mono<Datasource> generateAndSetDatasourcePolicies(Mono<User> userMono, Datasource datasource, Optional<AclPermission> permission) {
        return userMono
                .flatMap(user -> {
                    Mono<Workspace> workspaceMono = workspaceService.findById(datasource.getWorkspaceId(), permission)
                            .log()
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, datasource.getWorkspaceId())));

                    return workspaceMono.map(workspace -> {
                        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(workspace.getPolicies(), Workspace.class, Datasource.class);
                        datasource.setPolicies(documentPolicies);
                        return datasource;
                    });
                });
    }

    // TODO: Remove the following snippet after client side API changes
    @Override
    public Mono<Datasource> update(String id, Datasource datasource, String environmentId) {
        // since there was no datasource update differentiator between server invoked due to refresh token,
        // and user invoked. Hence the update is overloaded to provide the boolean for key diff.
        // adding a default false value here, the value is true only when
        // the user calls the update event from datasource controller, else it's false.
        return this.update(id, datasource, environmentId, Boolean.FALSE);
    }

    @Override
    public Mono<Datasource> update(String id, Datasource datasource, String environmentId, Boolean isUserRefreshedUpdate) {

        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        // Since policies are a server only concept, first set the empty set (set by constructor) to null
        datasource.setPolicies(null);

        Mono<Datasource> datasourceMono = findByIdWithStorages(id) // This will be removed once we have done our transition
                .then(repository.findById(id, datasourcePermission.getEditPermission()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)));


        // This is meant to be an update for just the datasource - like a rename
        return datasourceMono
                .map(dbDatasource -> {
                    copyNestedNonNullProperties(datasource, dbDatasource);
                    return dbDatasource;
                })
                .flatMap(this::validateAndSaveDatasourceToRepository)
                .flatMap(savedDatasource -> {
                    Map<String, Object> analyticsProperties = getAnalyticsProperties(savedDatasource);
                    if (isUserRefreshedUpdate.equals(Boolean.TRUE)) {
                        analyticsProperties.put(FieldName.IS_DATASOURCE_UPDATE_USER_INVOKED_KEY, Boolean.TRUE);
                    } else {
                        analyticsProperties.put(FieldName.IS_DATASOURCE_UPDATE_USER_INVOKED_KEY, Boolean.FALSE);
                    }
                    return analyticsService.sendUpdateEvent(savedDatasource, analyticsProperties);
                });
    }


    @Override
    public Mono<Datasource> updateDatasourceStorages(Datasource datasource, Boolean IsUserRefreshedUpdate) {
        String datasourceId = datasource.getId();

        Mono<Map<String, DatasourceStorageDTO>> savedStoragesMono =
                Flux.fromIterable(datasource.getDatasourceStorages().keySet())
                        .flatMap(environmentId -> datasourceStorageService
                                .updateByDatasourceAndEnvironmentId(datasource, environmentId, Boolean.TRUE))
                        .collectMap(datasourceStorage -> datasourceStorage.getEnvironmentId(),
                                datasourceStorage -> new DatasourceStorageDTO(datasourceStorage));


        // querying for each of the datasource
        Mono<Datasource> datasourceMono = repository.findById(datasourceId, datasourcePermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)));


        return datasourceMono.flatMap(datasource1 -> savedStoragesMono
                        .map(storages -> {
                            datasource1.setDatasourceStorages(storages);
                            return datasource1;
                        }));
    }

    @Override
    public Mono<Datasource> save(Datasource datasource) {
        if (datasource.getGitSyncId() == null) {
            datasource.setGitSyncId(datasource.getWorkspaceId() + "_" + Instant.now().toString());
        }
        return repository.save(datasource);
    }


    private Mono<Datasource> validateAndSaveDatasourceToRepository(Datasource datasource) {

        return Mono.just(datasource)
                .flatMap(this::validateDatasource)
                .flatMap(unsavedDatasource -> {
                    return repository.save(unsavedDatasource)
                            .map(savedDatasource -> {
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
        final Mono<Plugin> pluginMono = pluginService.findById(datasource.getPluginId());
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND,
                        FieldName.PLUGIN, datasource.getPluginId())));

        return checkPluginInstallationAndThenReturnWorkspaceMono
                .then(pluginExecutorMono)
                .map(pluginExecutor -> datasource);
    }

    /**
     * This function can now only be used if you send the entire datasource object and not just id inside the datasource object. We only fetch
     * the password from the db if its a saved datasource before testing.
     */
    @Override
    public Mono<DatasourceTestResult> testDatasource(DatasourceDTO datasourceDTO, String environmentId) {
        Datasource datasource = convertToDatasource(datasourceDTO, environmentId);
        DatasourceStorage datasourceStorage = datasourceStorageService
                .getDatasourceStorageFromDatasource(datasource, environmentId);

        Mono<DatasourceStorage> datasourceStorageMono = Mono.just(datasourceStorage)
                .map(datasourceStorageService::checkEnvironment);
        // Fetch any fields that maybe encrypted from the db if the datasource being tested does not have those fields set.
        // This scenario would happen whenever an existing datasource is being tested and no changes are present in the
        // encrypted field (because encrypted fields are not sent over the network after encryption back to the client
        if (datasourceStorage.getDatasourceId() != null && datasourceStorage.getDatasourceConfiguration() != null &&
                datasourceStorage.getDatasourceConfiguration().getAuthentication() != null) {
            datasourceStorageMono =
                    this.findById(datasource.getId(), datasourcePermission.getExecutePermission())
                            .flatMap(datasource1 -> datasourceStorageService.findByDatasourceAndEnvironmentId(datasource1, environmentId))
                            .map(datasourceStorage1 -> {
                                copyNestedNonNullProperties(datasourceStorage, datasourceStorage1);
                                return datasourceStorage1;
                            })
                            .switchIfEmpty(datasourceStorageMono);
        }

        return datasourceStorageMono
                .flatMap(this::verifyDatasourceAndTest);
    }

    protected Mono<DatasourceTestResult> verifyDatasourceAndTest(DatasourceStorage datasourceStorage) {
        return Mono.justOrEmpty(datasourceStorage)
                .flatMap(datasourceStorageService::validateDatasourceStorage)
                .flatMap(storage -> {
                    Mono<DatasourceTestResult> datasourceTestResultMono;
                    if (CollectionUtils.isEmpty(storage.getInvalids())) {
                        datasourceTestResultMono = testDatasourceViaPlugin(storage);
                    } else {
                        datasourceTestResultMono = Mono.just(new DatasourceTestResult(storage.getInvalids()));
                    }

                    return datasourceTestResultMono
                            .map(datasourceTestResult -> {
                                datasourceTestResult.setMessages(storage.getMessages());
                                return datasourceTestResult;
                            });
                });
    }

    protected Mono<DatasourceTestResult> testDatasourceViaPlugin(DatasourceStorage datasourceStorage) {
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginService.findById(datasourceStorage.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())));

        return pluginExecutorMono
                .flatMap(pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor)
                        .testDatasource(datasourceStorage.getDatasourceConfiguration()));
    }

    // TODO: Check usage
    @Override
    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission permission) {
        return repository.findByNameAndWorkspaceId(name, workspaceId, permission);
    }

    // TODO: Check usage
    @Override
    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> permission) {
        return repository.findByNameAndWorkspaceId(name, workspaceId, permission);
    }

    @Override
    public Mono<Datasource> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<Datasource> findByIdWithStorages(String id) {
        return repository.findById(id)
                .flatMap(datasource -> {
                    return datasourceStorageService.findByDatasource(datasource)
                            .collectMap(datasourceStorage -> datasourceStorage.getEnvironmentId(),
                                    datasourceStorage -> new DatasourceStorageDTO(datasourceStorage))
                            .map(storages -> {
                                datasource.setDatasourceStorages(storages);
                                return datasource;
                            });
                });
    }

    @Override
    public Mono<Datasource> findByIdAndEnvironmentId(String id, String environmentId) {
        return repository.findById(id)
                .flatMap(datasource -> {
                    return datasourceStorageService.findByDatasourceAndEnvironmentId(datasource, environmentId)
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
    public Flux<Datasource> getAll(MultiValueMap<String, String> params) {
        String workspaceId = params.getFirst(fieldName(QDatasource.datasource.workspaceId));
        if (workspaceId != null) {
            return this.getAllByWorkspaceId(workspaceId, Optional.of(datasourcePermission.getReadPermission()));
        }

        return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
    }

    @Override
    public Flux<Datasource> getAllByWorkspaceId(String workspaceId, Optional<AclPermission> permission) {

        return findAllByWorkspaceId(workspaceId, permission)
                .flatMap(datasource -> datasourceStorageService
                        .findByDatasource(datasource)
                        .flatMap(datasourceStorageService::populateHintMessages)
                        .map(DatasourceStorageDTO::new)
                        .collectMap(datasourceStorageDTO -> datasourceStorageDTO.getEnvironmentId(),
                                datasourceStorageDTO -> datasourceStorageDTO)
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

    // TODO: Check usage and switch to datasourcestorage
    private Flux<Datasource> findAllByWorkspaceId(String workspaceId, Optional<AclPermission> permission) {
        return repository.findAllByWorkspaceId(workspaceId, permission);
    }

    @Override
    public Flux<Datasource> saveAll(List<Datasource> datasourceList) {
        datasourceList
                .stream()
                .filter(datasource -> datasource.getGitSyncId() == null)
                .forEach(datasource -> datasource.setGitSyncId(datasource.getWorkspaceId() + "_" + Instant.now().toString()));
        return repository.saveAll(datasourceList);
    }

    @Override
    public Mono<Datasource> archiveById(String id) {
        return repository
                .findById(id, datasourcePermission.getDeletePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)))
                .zipWhen(datasource -> newActionRepository.countByDatasourceId(datasource.getId()))
                .flatMap(objects -> {
                    final Long actionsCount = objects.getT2();
                    if (actionsCount > 0) {
                        return Mono.error(new AppsmithException(AppsmithError.DATASOURCE_HAS_ACTIONS, actionsCount));
                    }
                    return Mono.just(objects.getT1());
                })
                .flatMap(toDelete -> {
                    return datasourceStorageService.findStrictlyByDatasourceId(toDelete.getId())
                            .flatMap(datasourceStorage -> {
                                return datasourceContextService.deleteDatasourceContext(datasourceStorage)
                                        .then(datasourceStorageService.archive(datasourceStorage));
                            })
                            .then(repository.archive(toDelete))
                            .thenReturn(toDelete);
                })
                .flatMap(datasource -> {
                    Map<String, String> eventData = Map.of(
                            FieldName.WORKSPACE_ID, datasource.getWorkspaceId()
                    );
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
    public DatasourceDTO convertToDatasourceDTO(Datasource datasource) {
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

        DatasourceStorageDTO datasourceStorageDTO = getFallbackDatasourceStorageDTO(datasource);
        return datasourceDTO;
    }

    // TODO: Remove the following snippet after client side API changes
    @Override
    public Datasource convertToDatasource(DatasourceDTO datasourceDTO, String environmentId) {
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
        datasource.setHasDatasourceStorage(true);

        return datasource;
    }

    // TODO: Remove the following snippet after client side API changes
    protected DatasourceStorageDTO getFallbackDatasourceStorageDTO(Datasource datasource) {
        return datasource.getDatasourceStorages().get(FieldName.UNUSED_ENVIRONMENT_ID);
    }

    // TODO: Remove the following snippet after client side API changes
    @Override
    public String getTrueEnvironmentId(String environmentId) {
        return FieldName.UNUSED_ENVIRONMENT_ID;
    }
}
