package com.appsmith.server.services;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.WorkspaceRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

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

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Test
    @WithUserDetails(value = "api_user")
    public void checkDecryptionOfAuthenticationDTOTest() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("checkDecryptionOfAuthenticationDTOTest");

        Workspace workspace = workspaceService.create(toCreate, apiUser).block();
        String workspaceId = workspace.getId();

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
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

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("checkDecryptionOfAuthenticationDTONullPassword");

        Workspace workspace = workspaceService.create(toCreate, apiUser).block();
        String workspaceId = workspace.getId();

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
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

}
