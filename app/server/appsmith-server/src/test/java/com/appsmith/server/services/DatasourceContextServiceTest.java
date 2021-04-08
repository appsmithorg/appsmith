package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;

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
    public void checkDecryptionOfAuthenticationDTONullPassword() {
//        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
//
//        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
//        Datasource datasource = new Datasource();
//        datasource.setName("test datasource name for authenticated fields decryption test null password");
//        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
//        datasourceConfiguration.setUrl("http://test.com");
//        DBAuth authenticationDTO = new DBAuth();
//        datasourceConfiguration.setAuthentication(authenticationDTO);
//        datasource.setDatasourceConfiguration(datasourceConfiguration);
//        datasource.setOrganizationId(orgId);
//
//        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
//            datasource.setPluginId(plugin.getId());
//            return datasource;
//        }).flatMap(datasourceService::create);
//
//        StepVerifier
//                .create(datasourceMono)
//                .assertNext(savedDatasource -> {
//                    DBAuth authentication = (DBAuth) savedDatasource.getDatasourceConfiguration().getAuthentication();
//                    DBAuth decryptedAuthentication = (DBAuth) datasourceContextService.decryptSensitiveFields(authentication);
//                    assertThat(decryptedAuthentication.getPassword()).isNull();
//                })
//                .verifyComplete();
    }

}
