package com.appsmith.server.services;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Endpoint;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ce.DatasourceContextInvalidationPublisher;
import com.appsmith.server.solutions.EnvironmentPermission;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
class DatasourceStorageUpdateBroadcastTest {

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private DatasourceStorageService datasourceStorageService;

    @Autowired
    private PluginService pluginService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private UserService userService;

    @Autowired
    private EnvironmentPermission environmentPermission;

    @MockitoBean
    private PluginExecutorHelper pluginExecutorHelper;

    @MockitoSpyBean
    private DatasourceContextInvalidationPublisher invalidationPublisher;

    private String workspaceId;
    private String defaultEnvironmentId;

    @BeforeEach
    void setup() {
        when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(new MockPluginExecutor()));
        doReturn(Mono.empty()).when(invalidationPublisher).publish(any());

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("DatasourceStorageUpdateBroadcastTest");
        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();
    }

    @AfterEach
    void cleanup() {
        workspaceService.archiveById(workspaceId).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_broadcastContextInvalidation_when_userUpdatesDatasourceStorage() {
        // Given
        Datasource datasource = createDatasource("old-password");
        DatasourceStorageDTO update =
                new DatasourceStorageDTO(datasource.getId(), defaultEnvironmentId, configuration("new-password"));

        // When
        AtomicReference<String> savedEnvironmentId = new AtomicReference<>();
        StepVerifier.create(datasourceService.updateDatasourceStorage(update, defaultEnvironmentId, Boolean.TRUE))
                .assertNext(updated -> savedEnvironmentId.set(updated.getDatasourceStorages().values().stream()
                        .findFirst()
                        .orElseThrow()
                        .getEnvironmentId()))
                .verifyComplete();

        // Then
        ArgumentCaptor<DatasourceStorage> captor = ArgumentCaptor.forClass(DatasourceStorage.class);
        verify(invalidationPublisher).publish(captor.capture());
        assertThat(captor.getValue().getDatasourceId()).isEqualTo(datasource.getId());
        assertThat(captor.getValue().getPluginId()).isEqualTo(datasource.getPluginId());
        assertThat(captor.getValue().getEnvironmentId()).isEqualTo(savedEnvironmentId.get());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_notBroadcastContextInvalidation_when_updateIsNotUserOriginated() {
        // Given
        Datasource datasource = createDatasource("old-password");
        DatasourceStorage update = storageFor(datasource, "refreshed-token");

        // When
        StepVerifier.create(datasourceStorageService.updateDatasourceStorage(
                        update, defaultEnvironmentId, Boolean.FALSE, false))
                .expectNextCount(1)
                .verifyComplete();

        // Then
        verify(invalidationPublisher, never()).publish(any());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_notBroadcastContextInvalidation_when_updateIsDryRun() {
        // Given
        Datasource datasource = createDatasource("old-password");
        DatasourceStorage update = storageFor(datasource, "new-password");

        // When
        StepVerifier.create(datasourceStorageService.updateDatasourceStorage(
                        update, defaultEnvironmentId, Boolean.TRUE, true))
                .expectNextCount(1)
                .verifyComplete();

        // Then
        verify(invalidationPublisher, never()).publish(any());
    }

    private Datasource createDatasource(String password) {
        Plugin plugin = pluginService.findByName("Installed Plugin Name").block();
        Datasource datasource = new Datasource();
        datasource.setName("broadcast test datasource");
        datasource.setWorkspaceId(workspaceId);
        datasource.setPluginId(plugin.getId());
        Map<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, configuration(password)));
        datasource.setDatasourceStorages(storages);
        return datasourceService.create(datasource).block();
    }

    private DatasourceStorage storageFor(Datasource datasource, String password) {
        DatasourceStorage datasourceStorage = datasourceStorageService.createDatasourceStorageFromDatasourceStorageDTO(
                new DatasourceStorageDTO(datasource.getId(), defaultEnvironmentId, configuration(password)));
        datasourceStorage.prepareTransientFields(datasource);
        return datasourceStorage;
    }

    private static DatasourceConfiguration configuration(String password) {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        configuration.setEndpoints(List.of(new Endpoint("db.example.test", 5432L)));
        DBAuth auth = new DBAuth();
        auth.setUsername("app_user");
        auth.setPassword(password);
        configuration.setAuthentication(auth);
        return configuration;
    }
}
