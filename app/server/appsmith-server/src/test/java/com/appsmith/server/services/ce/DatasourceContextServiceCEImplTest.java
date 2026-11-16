package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.domains.DatasourcePluginContext;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.solutions.DatasourcePermission;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

/**
 * Closing a datasource connection can block for many seconds, for example when a JDBC pool waits for hung
 * connections. The close must not run on the thread that delivered the preceding Mongo or Redis response, because
 * that thread is a shared Netty I/O thread. "io-loop" stands in for that thread in these tests.
 */
@ExtendWith(MockitoExtension.class)
class DatasourceContextServiceCEImplTest {

    private static final String DATASOURCE_ID = "datasource-id";
    private static final String PLUGIN_ID = "plugin-id";

    @Mock
    private DatasourceService datasourceService;

    @Mock
    private DatasourceStorageService datasourceStorageService;

    @Mock
    private PluginService pluginService;

    @Mock
    private PluginExecutorHelper pluginExecutorHelper;

    @Mock
    private ConfigService configService;

    @Mock
    private DatasourcePermission datasourcePermission;

    @Mock
    private FeatureFlagService featureFlagService;

    @Mock
    private PluginExecutor<Object> pluginExecutor;

    private DatasourceContextServiceCEImpl datasourceContextService;

    private Scheduler ioLoop;

    private final AtomicReference<String> destroyThreadName = new AtomicReference<>();

    private final DatasourceContextIdentifier datasourceContextIdentifier =
            new DatasourceContextIdentifier(DATASOURCE_ID, FieldName.UNUSED_ENVIRONMENT_ID);

    @BeforeEach
    void setUp() {
        datasourceContextService = new DatasourceContextServiceCEImpl(
                datasourceService,
                datasourceStorageService,
                pluginService,
                pluginExecutorHelper,
                configService,
                datasourcePermission,
                featureFlagService);
        ioLoop = Schedulers.newSingle("io-loop");

        Plugin plugin = new Plugin();
        plugin.setId(PLUGIN_ID);
        when(pluginService.findById(PLUGIN_ID)).thenReturn(Mono.just(plugin));
        when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        doAnswer(invocation -> {
                    destroyThreadName.set(Thread.currentThread().getName());
                    return null;
                })
                .when(pluginExecutor)
                .datasourceDestroy(any());
    }

    @AfterEach
    void tearDown() {
        ioLoop.dispose();
    }

    @Test
    void should_destroyConnectionOnBoundedElastic_when_datasourceContextIsDeleted() {
        // Given
        DatasourceContext<Object> datasourceContext = new DatasourceContext<>();
        datasourceContext.setConnection(new Object());
        datasourceContextService.datasourceContextMap.put(datasourceContextIdentifier, datasourceContext);
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(DATASOURCE_ID);
        datasourceStorage.setPluginId(PLUGIN_ID);

        // When
        Mono<DatasourceContext<?>> result = datasourceContextService
                .deleteDatasourceContext(datasourceStorage)
                .subscribeOn(ioLoop);

        // Then
        StepVerifier.create(result)
                .assertNext(removed -> assertThat(removed).isSameAs(datasourceContext))
                .verifyComplete();
        assertThat(destroyThreadName.get()).startsWith("boundedElastic");
        assertThat(datasourceContextService.datasourceContextMap).doesNotContainKey(datasourceContextIdentifier);
    }

    @Test
    void should_destroyConnectionOnBoundedElastic_when_lruCacheEvictsDatasourceContext() {
        // Given
        DatasourceContext<Object> datasourceContext = new DatasourceContext<>();
        datasourceContext.setConnection(new Object());
        datasourceContextService.datasourceContextMap.put(datasourceContextIdentifier, datasourceContext);
        DatasourcePluginContext<Object> datasourcePluginContext = new DatasourcePluginContext<>();
        datasourcePluginContext.setConnection(datasourceContext.getConnection());
        datasourcePluginContext.setPluginId(PLUGIN_ID);
        datasourceContextService.datasourcePluginContextMapLRUCache.put(
                datasourceContextIdentifier, datasourcePluginContext);

        // When
        Mono<Void> eviction = Mono.<Void>fromRunnable(
                        () -> datasourceContextService.datasourcePluginContextMapLRUCache.invalidate(
                                datasourceContextIdentifier))
                .subscribeOn(ioLoop);

        // Then
        StepVerifier.create(eviction).verifyComplete();
        await().atMost(Duration.ofSeconds(5))
                .untilAsserted(() -> assertThat(destroyThreadName.get()).startsWith("boundedElastic"));
    }
}
