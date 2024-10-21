package com.appsmith.server.services;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.cakes.DatasourceRepositoryCake;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import com.appsmith.server.repositories.cakes.WorkspaceRepositoryCake;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;

// TODO - With the introduction of AOP on the cake class,
//  the SpyBean mocking does not work on repository class, we need to investigate this and fix it.
//  Until then the test is refactored into this new class
//  where we are using the @MockBean annotation to mock the entire repository class
@SpringBootTest
@ExtendWith(AfterAllCleanUpExtension.class)
public class DatasourceContextServiceImplTest {

    @Autowired
    WorkspaceRepositoryCake workspaceRepository;

    @SpyBean
    PluginService pluginService;

    @Autowired
    DatasourceService datasourceService;

    @SpyBean
    DatasourceService spyDatasourceService;

    @SpyBean
    DatasourceStorageService datasourceStorageService;

    @MockBean
    DatasourceRepositoryCake datasourceRepository;

    @MockBean
    NewActionRepositoryCake newActionRepository;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    DatasourcePermission datasourcePermission;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @SpyBean
    DatasourceContextServiceImpl datasourceContextService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationPermission applicationPermission;

    String defaultEnvironmentId;

    String workspaceId;

    @BeforeEach
    public void setup() {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("DatasourceServiceTest");

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceCache_afterDatasourceDeleted_doesNotReturnOldConnection() {
        // Never require the datasource connection to be stale
        Plugin emptyPlugin = new Plugin();
        doReturn(false).doReturn(false).when(datasourceContextService).getIsStale(any(), any());

        MockPluginExecutor mockPluginExecutor = new MockPluginExecutor();
        MockPluginExecutor spyMockPluginExecutor = spy(mockPluginExecutor);
        /* Return two different connection objects if `datasourceCreate` method is called twice */
        doReturn(Mono.just("connection_1"))
                .doReturn(Mono.just("connection_2"))
                .when(spyMockPluginExecutor)
                .datasourceCreate(any());
        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(spyMockPluginExecutor));

        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setEnvironmentId(defaultEnvironmentId);
        datasourceStorage.setDatasourceId("id1");
        datasourceStorage.setDatasourceConfiguration(new DatasourceConfiguration());
        datasourceStorage.setWorkspaceId(workspaceId);

        DatasourceContextIdentifier datasourceContextIdentifier =
                new DatasourceContextIdentifier(datasourceStorage.getDatasourceId(), null);

        Object monitor = new Object();
        // Create one instance of datasource connection
        Mono<DatasourceContext<?>> dsContextMono1 = datasourceContextService.getCachedDatasourceContextMono(
                datasourceStorage, emptyPlugin, spyMockPluginExecutor, monitor, datasourceContextIdentifier);

        Datasource datasource = new Datasource();
        datasource.setId("id1");
        datasource.setWorkspaceId("workspaceId1");
        datasource.setPluginId("mockPluginId");
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId,
                datasourceStorageService.createDatasourceStorageDTOFromDatasourceStorage(datasourceStorage));
        datasource.setDatasourceStorages(storages);

        doReturn(Mono.just(datasource))
                .when(datasourceRepository)
                .findById("id1", datasourcePermission.getDeletePermission());
        doReturn(Mono.just(datasource))
                .when(datasourceRepository)
                .findById("id1", datasourcePermission.getExecutePermission());
        doReturn(Mono.just(new Plugin())).when(pluginService).findById("mockPlugin");
        doReturn(Mono.just(0L)).when(newActionRepository).countByDatasourceId("id1");
        doReturn(Mono.just(datasource)).when(datasourceRepository).archiveById("id1");
        doReturn(Flux.just(datasourceStorage)).when(datasourceStorageService).findStrictlyByDatasourceId("id1");
        doReturn(Mono.just(datasourceStorage)).when(datasourceStorageService).archive(datasourceStorage);
        doReturn(Mono.just(datasource)).when(datasourceService).archiveById("id1");
        // Now delete the datasource and check if the cache retains the same instance of connection
        Mono<DatasourceContext<?>> dsContextMono2 = datasourceService
                .archiveById("id1")
                .flatMap(deleted -> datasourceContextService.getCachedDatasourceContextMono(
                        datasourceStorage, emptyPlugin, spyMockPluginExecutor, monitor, datasourceContextIdentifier));

        StepVerifier.create(dsContextMono1)
                .assertNext(dsContext1 -> {
                    assertEquals("connection_1", dsContext1.getConnection());
                })
                .verifyComplete();

        StepVerifier.create(dsContextMono2)
                .assertNext(dsContext1 -> {
                    assertEquals("connection_2", dsContext1.getConnection());
                })
                .verifyComplete();
    }
}
