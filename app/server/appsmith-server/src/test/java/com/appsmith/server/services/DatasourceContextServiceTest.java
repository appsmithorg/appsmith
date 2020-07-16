package com.appsmith.server.services;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
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

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class DatasourceContextServiceTest {

    @Autowired
    DatasourceContextService datasourceContextService;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    PluginService pluginService;

    @Autowired
    DatasourceService datasourceService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    String orgId =  "";

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg.getId();
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
        AuthenticationDTO authenticationDTO = new AuthenticationDTO();
        String username = "username";
        String password = "password";
        authenticationDTO.setUsername(username);
        authenticationDTO.setPassword(password);
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        StepVerifier
                .create(datasourceMono)
                .assertNext(savedDatasource -> {
                    AuthenticationDTO authentication = savedDatasource.getDatasourceConfiguration().getAuthentication();
                    AuthenticationDTO decryptedAuthentication = datasourceContextService.decryptSensitiveFields(authentication);
                    assertThat(decryptedAuthentication.getPassword()).isEqualTo(password);
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
        AuthenticationDTO authenticationDTO = new AuthenticationDTO();
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        StepVerifier
                .create(datasourceMono)
                .assertNext(savedDatasource -> {
                    AuthenticationDTO authentication = savedDatasource.getDatasourceConfiguration().getAuthentication();
                    AuthenticationDTO decryptedAuthentication = datasourceContextService.decryptSensitiveFields(authentication);
                    assertThat(decryptedAuthentication.getPassword()).isNull();
                })
                .verifyComplete();
    }

}
