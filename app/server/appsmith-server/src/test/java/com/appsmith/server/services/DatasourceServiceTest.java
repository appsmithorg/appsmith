package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
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

    @Autowired
    OrganizationRepository organizationRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    static class TestPluginExecutor implements PluginExecutor {

        @Override
        public Mono<Object> execute(Object connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            System.out.println("In the execute");
            return null;
        }

        @Override
        public Mono<Object> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            System.out.println("In the datasourceCreate");
            return Mono.empty();
        }

        @Override
        public void datasourceDestroy(Object connection) {
            System.out.println("In the datasourceDestroy");

        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            System.out.println("In the datasourceValidate");
            return new HashSet<>();
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return Mono.just(new DatasourceTestResult());
        }
    }

    String orgId =  "";

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg.getId();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithNullPluginId() {
        Datasource datasource = new Datasource();
        datasource.setName("DS-with-null-pluginId");
        datasource.setOrganizationId(orgId);
        Mono<Datasource> datasourceMono = Mono.just(datasource)
                .flatMap(datasourceService::create);
        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getIsValid()).isFalse();
                    assertThat(createdDatasource.getInvalids().contains("Missing plugin id. Please input correct plugin id"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithId() {
        Datasource datasource = new Datasource();
        datasource.setId("randomId");
        datasource.setOrganizationId(orgId);
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
        datasource.setOrganizationId(orgId);
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
                    assertThat(createdDatasource.getIsValid()).isFalse();
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
        datasource.setOrganizationId(orgId);
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
                    Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
                            .build();

                    assertThat(createdDatasource.getPolicies()).isNotEmpty();
                    assertThat(createdDatasource.getPolicies()).containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createAndUpdateDatasourceValidDB() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new TestPluginExecutor()));

        Datasource datasource = new Datasource();
        datasource.setName("test db datasource");
        datasource.setOrganizationId(orgId);
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

        datasource.setOrganizationId(orgId);

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

    @Test
    @WithUserDetails(value = "api_user")
    public void createNamelessDatasource() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new TestPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");

        Datasource datasource1 = new Datasource();
        datasource1.setDatasourceConfiguration(new DatasourceConfiguration());
        datasource1.setOrganizationId(orgId);
        datasource1.getDatasourceConfiguration().setUrl("http://test.com");

        Datasource datasource2 = new Datasource();
        datasource2.setDatasourceConfiguration(new DatasourceConfiguration());
        datasource2.setOrganizationId(orgId);
        datasource2.getDatasourceConfiguration().setUrl("http://test.com");

        final Mono<Tuple2<Datasource, Datasource>> datasourcesMono = pluginMono
                .flatMap(plugin -> {
                        datasource1.setPluginId(plugin.getId());
                        datasource2.setPluginId(plugin.getId());
                        return datasourceService.create(datasource1);
                    })
                .zipWhen(datasource -> datasourceService.create(datasource2));

        StepVerifier
                .create(datasourcesMono)
                .assertNext(tuple2 -> {
                    final Datasource ds1 = tuple2.getT1();
                    assertThat(ds1.getId()).isNotEmpty();
                    assertThat(ds1.getPluginId()).isEqualTo(datasource1.getPluginId());
                    assertThat(ds1.getName()).isEqualTo("Untitled datasource");

                    final Datasource ds2 = tuple2.getT2();
                    assertThat(ds2.getId()).isNotEmpty();
                    assertThat(ds2.getPluginId()).isEqualTo(datasource1.getPluginId());
                    assertThat(ds2.getName()).isEqualTo("Untitled datasource 2");
                })
                .verifyComplete();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceValid() {

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name for test");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new TestPluginExecutor()));

        Mono<DatasourceTestResult> testResultMono = datasourceMono.flatMap(datasource1 -> datasourceService.testDatasource(datasource1));

        StepVerifier
                .create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isEmpty();
                })
                .verifyComplete();
    }
}
