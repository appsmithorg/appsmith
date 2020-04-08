package com.appsmith.server.services;

import com.appsmith.external.models.*;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class DatasourceServiceTest {

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    PluginService pluginService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    class TestPluginExecutor implements PluginExecutor {

        @Override
        public Mono<Object> execute(Object connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            System.out.println("In the execute");
            return null;
        }

        @Override
        public Object datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            System.out.println("In the datasourceCreate");
            return null;
        }

        @Override
        public void datasourceDestroy(Object connection) {
            System.out.println("In the datasourceDestroy");

        }

        @Override
        public Boolean isDatasourceValid(DatasourceConfiguration datasourceConfiguration) {
            System.out.println("In the datasourceValidate");
            return true;
        }
    }

    @Before
    public void setup() {

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithNullPluginId() {
        Datasource datasource = new Datasource();
        datasource.setName("DS-with-null-pluginId");
        Mono<Datasource> datasourceMono = Mono.just(datasource)
                .flatMap(datasourceService::create);
        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getIsValid() == false);
                    assertThat(createdDatasource.getInvalids().contains("Missing plugin id. Please input correct plugin id"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithId() {
        Datasource datasource = new Datasource();
        datasource.setId("randomId");
        Mono<Datasource> datasourceMono = Mono.just(datasource)
                .flatMap(datasourceService::create);
        StepVerifier
                .create(datasourceMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceNotInstalledPlugin() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new TestPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Not Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("DS-with-uninstalled-plugin");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getIsValid() == false);
                    assertThat(createdDatasource.getInvalids().contains("Plugin " + datasource.getPluginId() + " not installed"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceValid() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new TestPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createAndUpdateDatasourceValidDB() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new TestPluginExecutor()));

        Datasource datasource = new Datasource();
        datasource.setName("test db datasource");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_ONLY);
        connection.setType(Connection.Type.REPLICA_SET);
        SSLDetails sslDetails = new SSLDetails();
        sslDetails.setAuthType(SSLDetails.AuthType.CA_CERTIFICATE);
        sslDetails.setKeyFile(new UploadedFile("ssl_key_file_id", ""));
        sslDetails.setCertificateFile(new UploadedFile("ssl_cert_file_id", ""));
        connection.setSsl(sslDetails);
        datasourceConfiguration.setConnection(connection);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        datasource.setOrganizationId("fixme-put-valid-org-id-here");

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                }).flatMap(datasourceService::create)
                .flatMap(datasource1 -> {
                    Datasource updates = new Datasource();
                    DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
                    Connection connection1 = new Connection();
                    SSLDetails ssl = new SSLDetails();
                    ssl.setKeyFile(new UploadedFile());
                    ssl.getKeyFile().setName("ssl_key_file_id");
                    connection1.setSsl(ssl);
                    datasourceConfiguration1.setConnection(connection1);
                    return datasourceService.update(datasource1.getId(), updates);
                });

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getDatasourceConfiguration().getConnection().getSsl().getKeyFile().getName()).isEqualTo("ssl_key_file_id");
                })
                .verifyComplete();
    }
}
