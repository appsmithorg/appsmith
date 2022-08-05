package com.appsmith.server.services;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.WorkspaceRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class DatasourceContextServiceTest {

    @Autowired
    EncryptionService encryptionService;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    PluginService pluginService;

    @Autowired
    DatasourceService datasourceService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @SpyBean
    DatasourceContextServiceImpl datasourceContextService;

    String workspaceId = "";

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Workspace testWorkspace = workspaceRepository.findByName("Another Test Workspace", AclPermission.READ_WORKSPACES).block();
        workspaceId = testWorkspace.getId();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkDecryptionOfAuthenticationDTOTest() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name for authenticated fields decryption test");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        String username = "username";
        String password = "password";
        authenticationDTO.setUsername(username);
        authenticationDTO.setPassword(password);
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setWorkspaceId(workspaceId);

        final Datasource createdDatasource = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .block();

        assert createdDatasource != null;
        Mono<Datasource> datasourceMono = datasourceService.findById(createdDatasource.getId());

        StepVerifier
                .create(datasourceMono)
                .assertNext(savedDatasource -> {
                    DBAuth authentication = (DBAuth) savedDatasource.getDatasourceConfiguration().getAuthentication();
                    Assert.assertEquals(password, authentication.getPassword());
                    DBAuth encryptedAuthentication = (DBAuth) createdDatasource.getDatasourceConfiguration().getAuthentication();
                    Assert.assertEquals(encryptionService.encryptString(password), encryptedAuthentication.getPassword());
                })
                .verifyComplete();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void checkDecryptionOfAuthenticationDTONullPassword() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name for authenticated fields decryption test null password");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setWorkspaceId(workspaceId);

        final Datasource createdDatasource = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .block();

        assert createdDatasource != null;
        Mono<Datasource> datasourceMono = datasourceService.findById(createdDatasource.getId());

        StepVerifier
                .create(datasourceMono)
                .assertNext(savedDatasource -> {
                    DBAuth authentication = (DBAuth) savedDatasource.getDatasourceConfiguration().getAuthentication();
                    Assert.assertNull(authentication.getPassword());
                    DBAuth encryptedAuthentication = (DBAuth) createdDatasource.getDatasourceConfiguration().getAuthentication();
                    Assert.assertNull(encryptedAuthentication.getPassword());
                })
                .verifyComplete();
    }

    /**
     * This test checks that if `getCachedDatasourceCreate` method is called two times for the same datasource id, then
     * the datasource creation only happens once.
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testCachedDatasourceCreate() {
        doReturn(false).doReturn(false).when(datasourceContextService).getIsStale(any());

        MockPluginExecutor mockPluginExecutor = new MockPluginExecutor();
        MockPluginExecutor spyMockPluginExecutor = spy(mockPluginExecutor);
        /* Return two different connection objects if `datasourceCreate` method is called twice */
        doReturn(Mono.just("connection_1")).doReturn(Mono.just("connection_2")).when(spyMockPluginExecutor).datasourceCreate(any());

        Datasource datasource = new Datasource();
        datasource.setId("id");

        Object monitor = new Object();
        Mono<DatasourceContext> dsContextMono1 = datasourceContextService.getCachedDatasourceContextMono(datasource,
                spyMockPluginExecutor, monitor);
        Mono<DatasourceContext> dsContextMono2 = datasourceContextService.getCachedDatasourceContextMono(datasource,
                spyMockPluginExecutor, monitor);
        Mono<Tuple2<DatasourceContext, DatasourceContext>> zipMono = Mono.zip(dsContextMono1, dsContextMono2);
        StepVerifier.create(zipMono)
                .assertNext(tuple -> {
                    DatasourceContext dsContext1 = tuple.getT1();
                    DatasourceContext dsContext2 = tuple.getT2();
                    /* They can only be equal if the `datasourceCreate` method was called only once */
                    assertEquals(dsContext1.getConnection(), dsContext2.getConnection());
                    assertEquals("connection_1", dsContext1.getConnection());
                })
                .verifyComplete();
    }
}
