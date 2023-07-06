package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStorageTransferSolution;
import com.mongodb.MongoServerException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.UncategorizedMongoDbException;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class DatasourceStorageServiceCEImpl implements DatasourceStorageServiceCE {

    protected final DatasourceStorageRepository repository;
    private final DatasourceStorageTransferSolution datasourceStorageTransferSolution;
    private final DatasourcePermission datasourcePermission;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final AnalyticsService analyticsService;

    public DatasourceStorageServiceCEImpl(
            DatasourceStorageRepository repository,
            DatasourceStorageTransferSolution datasourceStorageTransferSolution,
            DatasourcePermission datasourcePermission,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            AnalyticsService analyticsService) {
        this.repository = repository;
        this.datasourceStorageTransferSolution = datasourceStorageTransferSolution;
        this.datasourcePermission = datasourcePermission;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.analyticsService = analyticsService;
    }

    @Override
    public Mono<DatasourceStorage> create(DatasourceStorage datasourceStorage) {
        return this.validateAndSaveDatasourceStorageToRepository(datasourceStorage)
                .flatMap(this::populateHintMessages) // For REST API datasource create flow.
                .flatMap(savedDatasourceStorage -> analyticsService.sendCreateEvent(
                        savedDatasourceStorage, getAnalyticsProperties(savedDatasourceStorage)));
    }

    @Override
    public Mono<DatasourceStorage> save(DatasourceStorage datasourceStorage) {
        return repository.save(datasourceStorage);
    }

    @Override
    public Mono<DatasourceStorage> archive(DatasourceStorage datasourceStorage) {
        return repository.archive(datasourceStorage);
    }

    @Override
    public Mono<DatasourceStorage> findByDatasourceAndEnvironmentId(Datasource datasource, String environmentId) {
        return this.findByDatasourceIdAndEnvironmentId(datasource.getId(), environmentId)
                .map(datasourceStorage -> {
                    datasourceStorage.prepareTransientFields(datasource);
                    return datasourceStorage;
                })
                // TODO: This is a temporary call being made till storage transfer migrations are done
                .switchIfEmpty(Mono.defer(() ->
                        datasourceStorageTransferSolution.transferAndGetDatasourceStorage(datasource, environmentId)))
                .onErrorResume(
                        e -> e instanceof DuplicateKeyException
                                || e instanceof MongoServerException
                                || e instanceof UncategorizedMongoDbException,
                        error -> {
                            if (error.getMessage() != null
                                    && error.getMessage().contains("datasource_storage_compound_index")) {
                                // The duplicate key error is because of the `name` field.
                                return findByDatasourceAndEnvironmentId(datasource, environmentId);
                            }
                            return Mono.error(error);
                        });
    }

    @Override
    public Mono<DatasourceStorage> findByDatasourceAndEnvironmentIdForExecution(
            Datasource datasource, String environmentId) {
        return this.findByDatasourceAndEnvironmentId(datasource, environmentId);
    }

    @Override
    public Flux<DatasourceStorage> findByDatasource(Datasource datasource) {
        return this.findByDatasourceId(datasource.getId())
                // TODO: This is a temporary call being made till storage transfer migrations are done
                .switchIfEmpty(Mono.defer(
                        () -> datasourceStorageTransferSolution.transferToFallbackEnvironmentAndGetDatasourceStorage(
                                datasource)))
                .onErrorResume(
                        e -> e instanceof DuplicateKeyException
                                || e instanceof MongoServerException
                                || e instanceof UncategorizedMongoDbException,
                        error -> {
                            if (error.getMessage() != null
                                    && error.getMessage().contains("datasource_storage_compound_index")) {
                                // The duplicate key error is because of the `name` field.
                                return findByDatasource(datasource);
                            }
                            return Mono.error(error);
                        });
    }

    protected Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        return repository.findByDatasourceIdAndEnvironmentId(datasourceId, FieldName.UNUSED_ENVIRONMENT_ID);
    }

    protected Flux<DatasourceStorage> findByDatasourceId(String datasourceId) {
        return repository.findByDatasourceId(datasourceId);
    }

    @Override
    public Flux<DatasourceStorage> findStrictlyByDatasourceId(String datasourceId) {
        return repository.findByDatasourceId(datasourceId);
    }

    @Override
    public Mono<DatasourceStorage> findStrictlyByDatasourceIdAndEnvironmentId(
            String datasourceId, String environmentId) {
        return repository.findByDatasourceIdAndEnvironmentId(datasourceId, environmentId);
    }

    @Override
    public Mono<DatasourceStorage> updateDatasourceStorage(
            DatasourceStorage datasourceStorage, String activeEnvironmentId, Boolean isUserRefreshedUpdate) {
        String datasourceId = datasourceStorage.getDatasourceId();
        String environmentId = datasourceStorage.getEnvironmentId();

        return this.findStrictlyByDatasourceIdAndEnvironmentId(datasourceId, environmentId)
                .flatMap(this::checkEnvironment)
                .map(dbStorage -> {
                    copyNestedNonNullProperties(datasourceStorage, dbStorage);

                    if (datasourceStorage.getDatasourceConfiguration() != null
                            && datasourceStorage.getDatasourceConfiguration().getAuthentication() == null) {
                        if (dbStorage.getDatasourceConfiguration() != null) {
                            dbStorage.getDatasourceConfiguration().setAuthentication(null);
                        }
                    }
                    return dbStorage;
                })
                .flatMap(this::validateAndSaveDatasourceStorageToRepository)
                .flatMap(savedDatasourceStorage -> {
                    Map<String, Object> analyticsProperties = getAnalyticsProperties(savedDatasourceStorage);
                    Boolean isUserInvokedUpdate = TRUE.equals(isUserRefreshedUpdate) ? TRUE : FALSE;

                    analyticsProperties.put(FieldName.IS_DATASOURCE_UPDATE_USER_INVOKED_KEY, isUserInvokedUpdate);
                    return analyticsService.sendUpdateEvent(savedDatasourceStorage, analyticsProperties);
                })
                .flatMap(this::populateHintMessages);
    }

    @Override
    public Mono<DatasourceStorage> validateDatasourceStorage(
            DatasourceStorage datasourceStorage, Boolean onlyConfiguration) {
        Set<String> invalids = new HashSet<>();
        datasourceStorage.setInvalids(invalids);

        // TODO: Get rid of this condition once client starts to have this information
        if (!Boolean.TRUE.equals(onlyConfiguration)) {
            if (!StringUtils.hasText(datasourceStorage.getDatasourceId())) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.DATASOURCE));
            }

            if (!StringUtils.hasText(datasourceStorage.getEnvironmentId())) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ENVIRONMENT));
            }
        }

        if (datasourceStorage.getDatasourceConfiguration() == null) {
            invalids.add(AppsmithError.NO_CONFIGURATION_FOUND_IN_DATASOURCE.getMessage());
        }

        final Mono<Plugin> pluginMono = pluginService.findById(datasourceStorage.getPluginId());
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper
                .getPluginExecutor(pluginMono)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())));

        return pluginExecutorMono
                .map(pluginExecutor -> {
                    DatasourceConfiguration datasourceConfiguration = datasourceStorage.getDatasourceConfiguration();
                    if (datasourceConfiguration != null
                            && !pluginExecutor.isDatasourceValid(
                                    datasourceConfiguration, datasourceStorage.isEmbedded())) {
                        invalids.addAll(pluginExecutor.validateDatasource(
                                datasourceConfiguration, datasourceStorage.isEmbedded()));
                    }

                    return datasourceStorage;
                })
                .onErrorResume(e -> {
                    invalids.add("Unable to validate datasource.");
                    return Mono.just(datasourceStorage);
                });
    }

    @Override
    public Mono<DatasourceStorage> validateDatasourceConfiguration(DatasourceStorage datasourceStorage) {
        return this.validateDatasourceStorage(datasourceStorage, true);
    }

    private Mono<DatasourceStorage> validateAndSaveDatasourceStorageToRepository(DatasourceStorage datasourceStorage) {

        return Mono.just(datasourceStorage)
                .map(this::sanitizeDatasourceStorage)
                .flatMap(datasourceStorage1 -> validateDatasourceStorage(datasourceStorage1, false))
                .flatMap(unsavedDatasourceStorage -> {
                    return repository.save(unsavedDatasourceStorage).map(datasourceStorage1 -> {
                        // datasourceStorage.pluginName is a transient field. It was set by validateDatasource method
                        // object from db will have pluginName=null so set it manually from the unsaved
                        // datasourceStorage obj
                        datasourceStorage1.setPluginName(unsavedDatasourceStorage.getPluginName());
                        return datasourceStorage1;
                    });
                });
    }

    @Override
    public Mono<DatasourceStorage> checkEnvironment(DatasourceStorage datasourceStorage) {
        datasourceStorage.setEnvironmentId(FieldName.UNUSED_ENVIRONMENT_ID);
        return Mono.just(datasourceStorage);
    }

    private DatasourceStorage sanitizeDatasourceStorage(DatasourceStorage datasourceStorage) {
        if (datasourceStorage.getDatasourceConfiguration() != null
                && !CollectionUtils.isEmpty(
                        datasourceStorage.getDatasourceConfiguration().getEndpoints())) {
            for (final Endpoint endpoint :
                    datasourceStorage.getDatasourceConfiguration().getEndpoints()) {
                if (endpoint != null && endpoint.getHost() != null) {
                    endpoint.setHost(endpoint.getHost().trim());
                }
            }
        }

        return datasourceStorage;
    }

    @Override
    public Mono<DatasourceStorage> populateHintMessages(DatasourceStorage datasourceStorage) {

        if (datasourceStorage == null) {
            /*
             * - Not throwing an exception here because we do not throw an error in case of missing datasourceStorage.
             *   We try not to fail as much as possible during create and update actions.
             */
            return Mono.just(new DatasourceStorage());
        }

        if (datasourceStorage.getPluginId() == null) {
            /*
             * - Not throwing an exception here because we try not to fail as much as possible during datasourceStorage create
             * and update events.
             */
            return Mono.just(datasourceStorage);
        }

        final Mono<Plugin> pluginMono = pluginService.findById(datasourceStorage.getPluginId());
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper
                .getPluginExecutor(pluginMono)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.PLUGIN, datasourceStorage.getPluginId())));

        /**
         * Delegate the task of generating hint messages to the concerned plugin, since only the
         * concerned plugin can correctly interpret their configuration.
         */
        return pluginExecutorMono
                .flatMap(pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor)
                        .getHintMessages(null, datasourceStorage.getDatasourceConfiguration()))
                .flatMap(tuple -> {
                    Set<String> datasourceHintMessages = tuple.getT1();
                    datasourceStorage.getMessages().addAll(datasourceHintMessages);
                    return Mono.just(datasourceStorage);
                });
    }

    @Override
    public Map<String, Object> getAnalyticsProperties(DatasourceStorage datasourceStorage) {
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put("pluginName", datasourceStorage.getPluginName());
        analyticsProperties.put("dsName", datasourceStorage.getName());
        analyticsProperties.put("dsId", datasourceStorage.getDatasourceId());
        analyticsProperties.put("envId", datasourceStorage.getEnvironmentId());
        DatasourceConfiguration dsConfig = datasourceStorage.getDatasourceConfiguration();
        if (dsConfig != null
                && dsConfig.getAuthentication() != null
                && dsConfig.getAuthentication() instanceof OAuth2) {
            analyticsProperties.put("oAuthStatus", dsConfig.getAuthentication().getAuthenticationStatus());
        }
        return analyticsProperties;
    }

    @Override
    public DatasourceStorageDTO getDatasourceStorageDTOFromDatasource(Datasource datasource, String environmentId) {
        if (datasource == null || datasource.getDatasourceStorages() == null) {
            return null;
        }
        return datasource.getDatasourceStorages().get(FieldName.UNUSED_ENVIRONMENT_ID);
    }

    @Override
    public DatasourceStorage getDatasourceStorageFromDatasource(Datasource datasource, String environmentId) {
        if (datasource == null || datasource.getDatasourceStorages() == null) {
            return null;
        }
        DatasourceStorageDTO datasourceStorageDTO =
                this.getDatasourceStorageDTOFromDatasource(datasource, environmentId);
        DatasourceStorage datasourceStorage = new DatasourceStorage(datasourceStorageDTO);
        datasourceStorage.prepareTransientFields(datasource);

        return datasourceStorage;
    }
}
