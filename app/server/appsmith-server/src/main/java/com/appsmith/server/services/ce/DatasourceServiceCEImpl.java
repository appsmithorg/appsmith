package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.QDatasource;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DatasourceAnalyticsUtils;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
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
import static com.appsmith.server.helpers.DatasourceAnalyticsUtils.getAnalyticsPropertiesForTestEventStatus;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;

@Slf4j
public class DatasourceServiceCEImpl extends BaseService<DatasourceRepository, Datasource, String>
        implements DatasourceServiceCE {

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

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
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
    }

    @Override
    public Mono<Datasource> create(Datasource datasource) {
        return createEx(datasource, Optional.of(workspacePermission.getDatasourceCreatePermission()));
    }

    @Override
    public Mono<Datasource> createWithoutPermissions(Datasource datasource) {
        return createEx(datasource, Optional.empty());
    }

    private Mono<Datasource> createEx(@NotNull Datasource datasource, Optional<AclPermission> permission) {
        // Validate incoming request
        String workspaceId = datasource.getWorkspaceId();
        if (workspaceId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }
        if (datasource.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        if (datasource.getPluginId() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PLUGIN_ID));
        }
        if (!StringUtils.hasLength(datasource.getGitSyncId())) {
            datasource.setGitSyncId(datasource.getWorkspaceId() + "_" + new ObjectId());
        }

        // Everything we create will have a storage kind of model for storing configs
        datasource.setDatasourceConfiguration(null);
        datasource.setHasDatasourceConfigurationStorage(true);

        Mono<Datasource> datasourceMono = Mono.just(datasource);

        // Determine valid name for datasource
        if (!StringUtils.hasLength(datasource.getName())) {
            datasourceMono = sequenceService
                    .getNextAsSuffix(Datasource.class, " for workspace with _id : " + workspaceId)
                    .zipWith(datasourceMono, (sequenceNumber, datasource1) -> {
                        datasource1.setName(Datasource.DEFAULT_NAME_PREFIX + sequenceNumber);
                        return datasource1;
                    });
        }

        // Figure out policies and save
        return datasourceMono
                .flatMap(datasource1 -> {
                    Mono<User> userMono = sessionUserService.getCurrentUser();
                    return generateAndSetDatasourcePolicies(userMono, datasource1, permission);
                })
                .flatMap(this::validateAndSaveDatasourceToRepository)
                .flatMap(savedDatasource ->
                        analyticsService.sendCreateEvent(savedDatasource, getAnalyticsProperties(savedDatasource))
                );
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

    @Override
    public Mono<Datasource> update(String id, Datasource datasource) {
        // since there was no datasource update differentiator between server invoked due to refresh token,
        // and user invoked. Hence the update is overloaded to provide the boolean for key diff.
        // adding a default false value here, the value is true only when the user calls the update event from datasource controller, else it's false.
        return update(id, datasource, Boolean.FALSE);
    }

    public Mono<Datasource> update(String id, Datasource datasource, Boolean isUserRefreshedUpdate) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        // Since policies are a server only concept, first set the empty set (set by constructor) to null
        datasource.setPolicies(null);

        Mono<Datasource> datasourceMono = repository.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, id)));

        return datasourceMono
                .map(dbDatasource -> {
                    copyNestedNonNullProperties(datasource, dbDatasource);
                    if (datasource.getDatasourceConfiguration() != null && datasource.getDatasourceConfiguration().getAuthentication() == null) {
                        if (dbDatasource.getDatasourceConfiguration() != null) {
                            dbDatasource.getDatasourceConfiguration().setAuthentication(null);
                        }
                    }
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
                })
                .flatMap(this::populateHintMessages);
    }

    @Override
    public Mono<DatasourceStorage> createDatasourceStorage(String datasourceId, DatasourceStorage datasourceStorage) {
        return this.findById(datasourceId, datasourcePermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)))
                .flatMap(datasource -> {
                    datasourceStorage.setTransientFields(datasource);
                    return datasourceStorageService.create(datasourceStorage);
                });
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

    private Mono<Datasource> validateDatasource(Datasource datasource) {
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
    public Mono<DatasourceTestResult> testDatasource(Datasource datasource, String environmentName) {
        Mono<Datasource> datasourceMono = Mono.just(datasource);
        //Adding analytics for test datasource event
        // Fetch any fields that maybe encrypted from the db if the datasource being tested does not have those fields set.
        // This scenario would happen whenever an existing datasource is being tested and no changes are present in the
        // encrypted field (because encrypted fields are not sent over the network after encryption back to the client
        if (datasource.getId() != null && datasource.getDatasourceConfiguration() != null &&
                datasource.getDatasourceConfiguration().getAuthentication() != null) {
            datasourceMono = getById(datasource.getId())
                    .map(datasource1 -> {
                        AppsmithBeanUtils.copyNestedNonNullProperties(datasource, datasource1);
                        return datasource1;
                    })
                    .switchIfEmpty(Mono.just(datasource));
        }
        return analyticsService.sendObjectEvent(AnalyticsEvents.DS_TEST_EVENT,datasource,
                getAnalyticsProperties(datasource)).then(verifyDatasourceAndTest(datasourceMono));
    }

    protected Mono<DatasourceTestResult> verifyDatasourceAndTest(Mono<Datasource> datasourceMono) {
        return datasourceMono
                .flatMap(this::validateDatasource)
                .flatMap(this::populateHintMessages)
                .flatMap(datasource1 -> {
                    Mono<DatasourceTestResult> datasourceTestResultMono;
                    if (CollectionUtils.isEmpty(datasource1.getInvalids())) {
                        datasourceTestResultMono = testDatasourceViaPlugin(datasource1);
                    } else {
                        datasourceTestResultMono = Mono.just(new DatasourceTestResult(datasource1.getInvalids()));
                    }

                    return datasourceTestResultMono
                            .flatMap(datasourceTestResult -> {
                                if(!CollectionUtils.isEmpty(datasourceTestResult.getInvalids())){
                                   return analyticsService.sendObjectEvent(AnalyticsEvents.DS_TEST_EVENT_FAILED,
                                           datasource1,getAnalyticsPropertiesForTestEventStatus(datasource1,
                                                   datasourceTestResult)).thenReturn(datasourceTestResult);

                                } else {
                                    return analyticsService.sendObjectEvent(AnalyticsEvents.DS_TEST_EVENT_SUCCESS,
                                                    datasource1, getAnalyticsPropertiesForTestEventStatus(datasource1,
                                                            datasourceTestResult)).thenReturn(datasourceTestResult);
                                }
                            })
                            .map(datasourceTestResult -> {
                                datasourceTestResult.setMessages(datasource1.getMessages());
                                return datasourceTestResult;
                            });

                });
    }

    protected Mono<DatasourceTestResult> testDatasourceViaPlugin(Datasource datasource) {
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginService.findById(datasource.getPluginId()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasource.getPluginId())));

        return pluginExecutorMono
                .flatMap(pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor)
                        .testDatasource(datasource.getDatasourceConfiguration()));
    }

    @Override
    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission permission) {
        return repository.findByNameAndWorkspaceId(name, workspaceId, permission);
    }

    @Override
    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> permission) {
        return repository.findByNameAndWorkspaceId(name, workspaceId, permission);
    }

    @Override
    public Mono<Datasource> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
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
    public Flux<DatasourceStorage> getAllStorages(MultiValueMap<String, String> params) {
        String workspaceId = params.getFirst(fieldName(QDatasource.datasource.workspaceId));
        if (workspaceId != null) {
            return this.getStoragesByWorkspaceId(workspaceId, datasourcePermission.getReadPermission());
        }

        return Flux.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
    }

    @Override
    public Flux<DatasourceStorage> getStoragesByWorkspaceId(String workspaceId, AclPermission permission) {

        return findAllByWorkspaceId(workspaceId, permission)
                .collectList()
                .map(datasourceList -> {
                    markRecentlyUsed(datasourceList, 3);
                    return datasourceList;
                })
                .flatMapMany(Flux::fromIterable)
                .flatMap(datasource -> datasourceStorageService
                        .findByDatasourceAndEnvironmentId(datasource, null)
                        .flatMap(datasourceStorageService::populateHintMessages));

    }

    // TODO: Check usage and switch to datasourcestorage
    private Flux<Datasource> findAllByWorkspaceId(String workspaceId, AclPermission permission) {
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
                    DatasourceContextIdentifier datasourceContextIdentifier = datasourceContextService.initializeDatasourceContextIdentifier(toDelete);
                    return datasourceContextService.deleteDatasourceContext(datasourceContextIdentifier)
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
}
