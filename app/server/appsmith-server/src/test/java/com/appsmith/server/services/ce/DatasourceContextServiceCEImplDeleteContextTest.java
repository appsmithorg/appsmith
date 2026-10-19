package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.solutions.DatasourcePermission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatasourceContextServiceCEImplDeleteContextTest {

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

    private DatasourceContextServiceCEImpl service;
    private DatasourceStorage datasourceStorage;
    private DatasourceContextIdentifier key;

    @BeforeEach
    void setup() {
        service = new DatasourceContextServiceCEImpl(
                datasourceService,
                datasourceStorageService,
                pluginService,
                pluginExecutorHelper,
                configService,
                datasourcePermission,
                featureFlagService);
        datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId("ds-1");
        datasourceStorage.setEnvironmentId("env-1");
        datasourceStorage.setPluginId("plugin-1");
        key = service.initializeDatasourceContextIdentifier(datasourceStorage);
        when(pluginService.findById("plugin-1")).thenReturn(Mono.just(new Plugin()));
    }

    @Test
    void should_destroyConnectionOffCallingThread_when_deletingContext() {
        // Given
        Object connection = new Object();
        DatasourceContext<Object> context = new DatasourceContext<>();
        context.setConnection(connection);
        service.datasourceContextMap.put(key, context);
        when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(pluginExecutor));
        AtomicReference<String> destroyThread = new AtomicReference<>();
        doAnswer(invocation -> {
                    destroyThread.set(Thread.currentThread().getName());
                    return null;
                })
                .when(pluginExecutor)
                .datasourceDestroy(connection);

        // When
        StepVerifier.create(service.deleteDatasourceContext(datasourceStorage))
                .expectNextMatches(removed -> removed == context)
                .verifyComplete();

        // Then
        assertThat(destroyThread.get()).startsWith("boundedElastic");
        assertThat(service.datasourceContextMap).doesNotContainKey(key);
    }

    @Test
    void should_keepRebuiltContext_when_contextIsReplacedWhileDeleting() {
        // Given
        Object staleConnection = new Object();
        DatasourceContext<Object> staleContext = new DatasourceContext<>();
        staleContext.setConnection(staleConnection);
        Mono<DatasourceContext<Object>> staleMono = Mono.just(staleContext);
        service.datasourceContextMap.put(key, staleContext);
        service.datasourceContextMonoMap.put(key, staleMono);

        Object freshConnection = new Object();
        DatasourceContext<Object> freshContext = new DatasourceContext<>();
        freshContext.setConnection(freshConnection);
        Mono<DatasourceContext<Object>> freshMono = Mono.just(freshContext);
        // A query on this pod rebuilds the context while the delete is waiting for the plugin executor.
        when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.fromCallable(() -> {
            service.datasourceContextMap.put(key, freshContext);
            service.datasourceContextMonoMap.put(key, freshMono);
            return pluginExecutor;
        }));

        // When
        StepVerifier.create(service.deleteDatasourceContext(datasourceStorage)).verifyComplete();

        // Then
        assertThat(service.datasourceContextMap.get(key)).isSameAs(freshContext);
        assertThat(service.datasourceContextMonoMap.get(key)).isSameAs(freshMono);
        verify(pluginExecutor).datasourceDestroy(staleConnection);
        verify(pluginExecutor, never()).datasourceDestroy(freshConnection);
    }
}
