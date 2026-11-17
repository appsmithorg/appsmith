package com.appsmith.server.datasources.base;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.DBOpsType;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.testhelpers.ReadBarrierHashMap;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatasourceServiceCEImplTest {

    private static final int DATASOURCE_COUNT = 4;
    private static final String WORKSPACE_ID = "workspace-id";
    private static final String PLUGIN_ID = "plugin-id";

    @Mock
    private DatasourceRepository repository;

    @Mock
    private WorkspaceService workspaceService;

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private SessionUserService sessionUserService;

    @Mock
    private PluginService pluginService;

    @Mock
    private PluginExecutorHelper pluginExecutorHelper;

    @Mock
    private PolicyGenerator policyGenerator;

    @Mock
    private DatasourceStorageService datasourceStorageService;

    @InjectMocks
    private DatasourceServiceCEImpl datasourceService;

    private ExecutorService storageCreateExecutor;

    @BeforeEach
    void setUp() {
        storageCreateExecutor = Executors.newFixedThreadPool(DATASOURCE_COUNT);
    }

    @AfterEach
    void tearDown() {
        storageCreateExecutor.shutdownNow();
    }

    @Test
    void should_keepEveryDryRunStorage_when_datasourcesAreCreatedConcurrently() {
        // Given
        Workspace workspace = new Workspace();
        workspace.setId(WORKSPACE_ID);
        Plugin plugin = new Plugin();
        plugin.setId(PLUGIN_ID);
        plugin.setName("Test plugin");
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(new User()));
        when(workspaceService.findById(eq(WORKSPACE_ID), isNull())).thenReturn(Mono.just(workspace));
        when(policyGenerator.getAllChildPolicies(any(), eq(Workspace.class), eq(Datasource.class)))
                .thenReturn(Set.of());
        when(workspaceService.findByIdAndPluginsPluginId(WORKSPACE_ID, PLUGIN_ID))
                .thenReturn(Mono.just(workspace));
        when(pluginService.findById(PLUGIN_ID)).thenReturn(Mono.just(plugin));
        when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(mock(PluginExecutor.class)));
        when(repository.setUserPermissionsInObject(any(Datasource.class)))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(analyticsService.sendCreateEvent(any(Datasource.class), anyMap()))
                .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(datasourceStorageService.createDatasourceStorageFromDatasourceStorageDTO(any()))
                .thenAnswer(invocation -> toStorage(invocation.getArgument(0)));
        when(datasourceStorageService.createDatasourceStorageDTOFromDatasourceStorage(any()))
                .thenAnswer(invocation -> toStorageDTO(invocation.getArgument(0)));

        // Each storage create finishes on its own thread, as the reactive Mongo call inside it does during an import.
        Scheduler storageCreateThreads = Schedulers.fromExecutorService(storageCreateExecutor);
        when(datasourceStorageService.create(any(DatasourceStorage.class), eq(true)))
                .thenAnswer(invocation -> {
                    DatasourceStorage storage = invocation.getArgument(0);
                    return Mono.fromSupplier(() -> storage).subscribeOn(storageCreateThreads);
                });

        List<Datasource> datasources = IntStream.range(0, DATASOURCE_COUNT)
                .mapToObj(index -> newDatasource("datasource-" + index))
                .toList();

        // The import passes one dry-run map to every create call. This map makes every caller read it before any
        // caller writes to it.
        ReadBarrierHashMap<DBOpsType, List<DatasourceStorage>> dryRunQueries =
                new ReadBarrierHashMap<>(DATASOURCE_COUNT);

        // When
        Mono<List<Datasource>> createdDatasources = Flux.fromIterable(datasources)
                .flatMap(datasource -> datasourceService.createWithoutPermissions(datasource, dryRunQueries))
                .collectList();

        // Then
        StepVerifier.create(createdDatasources)
                .assertNext(created -> assertThat(created).hasSize(DATASOURCE_COUNT))
                .expectComplete()
                .verify(Duration.ofSeconds(30));
        assertThat(dryRunQueries.getWithoutWaiting(DBOpsType.SAVE))
                .extracting(DatasourceStorage::getName)
                .containsExactlyInAnyOrder("datasource-0", "datasource-1", "datasource-2", "datasource-3");
    }

    private static Datasource newDatasource(String name) {
        DatasourceStorageDTO storageDTO =
                new DatasourceStorageDTO(null, FieldName.UNUSED_ENVIRONMENT_ID, new DatasourceConfiguration());
        Map<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(FieldName.UNUSED_ENVIRONMENT_ID, storageDTO);

        Datasource datasource = new Datasource();
        datasource.setName(name);
        datasource.setWorkspaceId(WORKSPACE_ID);
        datasource.setPluginId(PLUGIN_ID);
        datasource.setDatasourceStorages(storages);
        return datasource;
    }

    private static DatasourceStorage toStorage(DatasourceStorageDTO storageDTO) {
        DatasourceStorage storage = new DatasourceStorage();
        storage.setEnvironmentId(storageDTO.getEnvironmentId());
        storage.setDatasourceConfiguration(storageDTO.getDatasourceConfiguration());
        return storage;
    }

    private static DatasourceStorageDTO toStorageDTO(DatasourceStorage storage) {
        return new DatasourceStorageDTO(
                storage.getDatasourceId(), storage.getEnvironmentId(), storage.getDatasourceConfiguration());
    }
}
