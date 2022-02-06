package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
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
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
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
    OrganizationService organizationService;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    EncryptionService encryptionService;

    @Autowired
    LayoutActionService layoutActionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    String orgId = "";

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg == null ? "" : testOrg.getId();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void datasourceDefaultNameCounterAsPerOrgId() {
        //Create new organization
        Organization organization1 = new Organization();
        organization1.setId("random-org-id-1");
        organization1.setName("Random Org 1");

        StepVerifier.create(organizationService.create(organization1)
                .flatMap(org -> {
                    Datasource datasource = new Datasource();
                    datasource.setOrganizationId(org.getId());
                    return datasourceService.create(datasource);
                })
                .flatMap(datasource1 -> {
                    Organization organization2 = new Organization();
                    organization2.setId("random-org-id-2");
                    organization2.setName("Random Org 2");
                    return Mono.zip(Mono.just(datasource1), organizationService.create(organization2));
                })
                .flatMap(object -> {
                    final Organization org2 = object.getT2();
                    Datasource datasource2 = new Datasource();
                    datasource2.setOrganizationId(org2.getId());
                    return Mono.zip(Mono.just(object.getT1()), datasourceService.create(datasource2));
                }))
                .assertNext(datasource -> {
                    assertThat(datasource.getT1().getName()).isEqualTo("Untitled Datasource");
                    assertThat(datasource.getT1().getOrganizationId()).isEqualTo("random-org-id-1");
                    assertThat(datasource.getT2().getName()).isEqualTo("Untitled Datasource");
                    assertThat(datasource.getT2().getOrganizationId()).isEqualTo("random-org-id-2");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithNullPluginId() {
        Datasource datasource = new Datasource();
        datasource.setName("DS-with-null-pluginId");
        datasource.setOrganizationId(orgId);
        StepVerifier
                .create(datasourceService.create(datasource))
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
    public void createDatasourceWithNullOrganizationId() {
        Datasource datasource = new Datasource();
        datasource.setName("DS-with-null-organizationId");
        datasource.setPluginId("random plugin id");
        StepVerifier
                .create(datasourceService.validateDatasource(datasource))
                .assertNext(datasource1 -> {
                    assertThat(datasource1.getName()).isEqualTo(datasource.getName());
                    assertThat(datasource1.getIsValid()).isFalse();
                    assertThat(datasource1.getInvalids().contains(AppsmithError.ORGANIZATION_ID_NOT_GIVEN.getMessage()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithId() {
        Datasource datasource = new Datasource();
        datasource.setId("randomId");
        datasource.setOrganizationId(orgId);
        StepVerifier
                .create(datasourceService.create(datasource))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceNotInstalledPlugin() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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
                    ssl.getKeyFile().setName("ssl_key_file_id2");
                    connection1.setSsl(ssl);
                    datasourceConfiguration1.setConnection(connection1);
                    updates.setDatasourceConfiguration(datasourceConfiguration1);
                    return datasourceService.update(datasource1.getId(), updates);
                });

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getDatasourceConfiguration().getConnection().getSsl().getKeyFile().getName()).isEqualTo("ssl_key_file_id2");

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createAndUpdateDatasourceDifferentAuthentication() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = new Datasource();
        datasource.setName("test db datasource1");
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
        DBAuth auth = new DBAuth();
        auth.setUsername("test");
        auth.setPassword("test");
        datasourceConfiguration.setAuthentication(auth);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        datasource.setOrganizationId(orgId);

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 -> {
                    Datasource updates = new Datasource();
                    DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
                    Connection connection1 = new Connection();
                    SSLDetails ssl = new SSLDetails();
                    ssl.setKeyFile(new UploadedFile());
                    ssl.getKeyFile().setName("ssl_key_file_id2");
                    connection1.setSsl(ssl);
                    OAuth2 auth2 = new OAuth2();
                    auth2.setClientId("test");
                    auth2.setClientSecret("test");
                    datasourceConfiguration1.setAuthentication(auth2);
                    datasourceConfiguration1.setConnection(connection1);
                    updates.setDatasourceConfiguration(datasourceConfiguration1);

                    return datasourceService.update(datasource1.getId(), updates);
                });

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getDatasourceConfiguration().getConnection().getSsl().getKeyFile().getName()).isEqualTo("ssl_key_file_id2");
                    assertThat(createdDatasource.getDatasourceConfiguration().getAuthentication() instanceof OAuth2).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createNamelessDatasource() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");

        Datasource datasource1 = new Datasource();
        datasource1.setDatasourceConfiguration(new DatasourceConfiguration());
        datasource1.getDatasourceConfiguration().setUrl("http://test.com");
        datasource1.setOrganizationId(orgId);

        Datasource datasource2 = new Datasource();
        datasource2.setDatasourceConfiguration(new DatasourceConfiguration());
        datasource2.getDatasourceConfiguration().setUrl("http://test.com");
        datasource2.setOrganizationId(orgId);

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
                    assertThat(ds1.getName()).isEqualTo("Untitled Datasource");

                    final Datasource ds2 = tuple2.getT2();
                    assertThat(ds2.getId()).isNotEmpty();
                    assertThat(ds2.getPluginId()).isEqualTo(datasource1.getPluginId());
                    assertThat(ds2.getName()).isEqualTo("Untitled Datasource 2");
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

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<DatasourceTestResult> testResultMono = datasourceMono.flatMap(datasource1 -> datasourceService.testDatasource(datasource1));

        StepVerifier
                .create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceEmptyFields() {

        Datasource datasource = new Datasource();
        datasource.setName("test db datasource empty");
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
        DBAuth auth = new DBAuth();
        auth.setUsername("test");
        auth.setPassword("test");
        datasourceConfiguration.setAuthentication(auth);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        datasource.setOrganizationId(orgId);

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");

        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<DatasourceTestResult> testResultMono = datasourceMono.flatMap(datasource1 -> {
            ((DBAuth) datasource1.getDatasourceConfiguration().getAuthentication()).setPassword(null);
            return datasourceService.testDatasource(datasource1);
        });

        StepVerifier
                .create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteDatasourceWithoutActions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name for deletion");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);
        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 -> datasourceService.delete(datasource1.getId()));

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getDeletedAt()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteDatasourceWithActions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Datasource> datasourceMono = Mono
                .zip(
                        organizationRepository.findByName("Spring Test Organization", AclPermission.READ_ORGANIZATIONS),
                        pluginService.findByName("Installed Plugin Name")
                )
                .flatMap(objects -> {
                    final Organization organization = objects.getT1();
                    final Plugin plugin = objects.getT2();

                    Datasource datasource = new Datasource();
                    datasource.setName("test datasource name for deletion with actions");
                    DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
                    datasourceConfiguration.setUrl("http://test.com");
                    datasource.setDatasourceConfiguration(datasourceConfiguration);
                    datasource.setOrganizationId(organization.getId());
                    datasource.setPluginId(plugin.getId());

                    final Application application = new Application();
                    application.setName("application 1");

                    return Mono.zip(
                            Mono.just(organization),
                            Mono.just(plugin),
                            datasourceService.create(datasource),
                            applicationPageService.createApplication(application, organization.getId())
                                    .flatMap(application1 -> {
                                        final PageDTO page = new PageDTO();
                                        page.setName("test page 1");
                                        page.setApplicationId(application1.getId());
                                        page.setPolicies(Set.of(Policy.builder()
                                                .permission(READ_PAGES.getValue())
                                                .users(Set.of("api_user"))
                                                .build()
                                        ));
                                        return applicationPageService.createPage(page);
                                    })
                    );
                })
                .flatMap(objects -> {
                    final Datasource datasource = objects.getT3();
                    final PageDTO page = objects.getT4();

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setOrganizationId(objects.getT1().getId());
                    action.setPluginId(objects.getT2().getId());
                    action.setPageId(page.getId());
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    return layoutActionService.createSingleAction(action).thenReturn(datasource);
                })
                .flatMap(datasource -> datasourceService.delete(datasource.getId()));

        StepVerifier
                .create(datasourceMono)
                .verifyErrorMessage(AppsmithError.DATASOURCE_HAS_ACTIONS.getMessage("1"));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteDatasourceWithDeletedActions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Datasource> datasourceMono = Mono
                .zip(
                        organizationRepository.findByName("Spring Test Organization", AclPermission.READ_ORGANIZATIONS),
                        pluginService.findByName("Installed Plugin Name")
                )
                .flatMap(objects -> {
                    final Organization organization = objects.getT1();
                    final Plugin plugin = objects.getT2();

                    Datasource datasource = new Datasource();
                    datasource.setName("test datasource name for deletion with deleted actions");
                    DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
                    datasourceConfiguration.setUrl("http://test.com");
                    datasource.setDatasourceConfiguration(datasourceConfiguration);
                    datasource.setOrganizationId(organization.getId());
                    datasource.setPluginId(plugin.getId());

                    final Application application = new Application();
                    application.setName("application 2");

                    return Mono.zip(
                            Mono.just(organization),
                            Mono.just(plugin),
                            datasourceService.create(datasource),
                            applicationPageService.createApplication(application, organization.getId())
                                    .zipWhen(application1 -> {
                                        final PageDTO page = new PageDTO();
                                        page.setName("test page 1");
                                        page.setApplicationId(application1.getId());
                                        page.setPolicies(Set.of(Policy.builder()
                                                .permission(READ_PAGES.getValue())
                                                .users(Set.of("api_user"))
                                                .build()
                                        ));
                                        return applicationPageService.createPage(page);
                                    })
                    );
                })
                .flatMap(objects -> {
                    final Datasource datasource = objects.getT3();
                    final Application application = objects.getT4().getT1();
                    final PageDTO page = objects.getT4().getT2();

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setOrganizationId(objects.getT1().getId());
                    action.setPluginId(objects.getT2().getId());
                    action.setPageId(page.getId());
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    return layoutActionService.createSingleAction(action)
                            .then(applicationPageService.deleteApplication(application.getId()))
                            .thenReturn(datasource);
                })
                .flatMap(datasource -> datasourceService.delete(datasource.getId()));

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getName()).isEqualTo("test datasource name for deletion with deleted actions");
                    assertThat(createdDatasource.getDeletedAt()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkEncryptionOfAuthenticationDTOTest() {
        // For this test, simply inserting a new datasource with authentication should immediately
        // set the authentication object as encrypted
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name for authenticated fields encryption test");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
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
                    DBAuth authentication = (DBAuth) savedDatasource.getDatasourceConfiguration().getAuthentication();
                    assertThat(authentication.getUsername()).isEqualTo(username);
                    assertThat(authentication.getPassword()).isEqualTo(encryptionService.encryptString(password));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkEncryptionOfAuthenticationDTONullPassword() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name for authenticated fields encryption test null password.");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        authenticationDTO.setDatabaseName("admin");
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
                    DBAuth authentication = (DBAuth) savedDatasource.getDatasourceConfiguration().getAuthentication();
                    assertThat(authentication.getUsername()).isNull();
                    assertThat(authentication.getPassword()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkEncryptionOfAuthenticationDTOAfterUpdate() {
        // Here, we're replacing an existing encrypted field with another
        // Encyption state would stay the same, that is, as true
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name for authenticated fields encryption test post update");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        String username = "username";
        String password = "password";
        authenticationDTO.setUsername(username);
        authenticationDTO.setPassword(password);
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Datasource createdDatasource = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create).block();

        Mono<Datasource> datasourceMono = Mono.just(createdDatasource)
                .flatMap(original -> {
                    Datasource datasource1 = new Datasource();
                    // Here we still need to send some object of authentication type to make sure that the entire object is not replaced by null
                    DBAuth partialAuthenticationDTO = new DBAuth();
                    partialAuthenticationDTO.setUsername(username);
                    datasourceConfiguration.setAuthentication(partialAuthenticationDTO);
                    datasource1.setDatasourceConfiguration(datasourceConfiguration);
                    datasource1.setName("New Name for update to test that encryption is still correct");
                    return datasourceService.update(original.getId(), datasource1);
                });

        StepVerifier
                .create(datasourceMono)
                .assertNext(updatedDatasource -> {
                    DBAuth authentication = (DBAuth) updatedDatasource.getDatasourceConfiguration().getAuthentication();

                    assertThat(authentication.getUsername()).isEqualTo(username);
                    assertThat(encryptionService.encryptString(password)).isEqualTo(authentication.getPassword());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkEncryptionOfAuthenticationDTOAfterRemoval() {
        // Here is when authentication is removed from a datasource
        // We want the entire authentication object to be discarded here to avoid reusing any sensitive data across types
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name for authenticated fields encryption test post removal");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        String username = "username";
        String password = "password";
        authenticationDTO.setUsername(username);
        authenticationDTO.setPassword(password);
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Datasource createdDatasource = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create).block();

        Mono<Datasource> datasourceMono = Mono.just(createdDatasource)
                .flatMap(original -> {
                    Datasource datasource1 = new Datasource();
                    // Here we abstain from sending an authentication object to remove the field from datasourceConfiguration
                    DatasourceConfiguration datasourceConfiguration2 = new DatasourceConfiguration();
                    datasourceConfiguration2.setUrl("http://test.com");
                    datasource1.setDatasourceConfiguration(datasourceConfiguration2);
                    datasource1.setName("New Name for update to test that encryption is now gone");
                    return datasourceService.update(original.getId(), datasource1);
                });

        StepVerifier
                .create(datasourceMono)
                .assertNext(updatedDatasource -> {
                    assertThat(updatedDatasource.getDatasourceConfiguration().getAuthentication()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithInvalidCharsInHost() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByPackageName("installed-db-plugin");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name with invalid hostnames");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        datasourceConfiguration.getEndpoints().add(new Endpoint("hostname/", 5432L));
        datasourceConfiguration.getEndpoints().add(new Endpoint("hostname:", 5432L));
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
                    assertThat(createdDatasource.getInvalids()).isEmpty();

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
    public void createDatasourceWithHostnameStartingWithSpace() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByPackageName("installed-db-plugin");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name with hostname starting/ending with space");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        datasourceConfiguration.getEndpoints().add(new Endpoint(" hostname ", 5432L));
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
                    assertThat(createdDatasource.getInvalids()).isEmpty();
                    assertThat(createdDatasource.getDatasourceConfiguration().getEndpoints()).isEqualTo(List.of(new Endpoint("hostname", 5432L)));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostUrlOnTestDatasourceEvent() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("testName 1");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("http://localhost", 0L);
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        datasourceConfiguration.getEndpoints().add(endpoint);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource.setOrganizationId(orgId);

        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<DatasourceTestResult> testResultMono = datasourceMono.flatMap(datasource1 -> datasourceService.testDatasource(datasource1));

        StepVerifier
                .create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isEmpty();
                    assertThat(testResult.getMessages()).isNotEmpty();

                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running " +
                            "inside a docker container or on the cloud. To enable access to your localhost you may use " +
                            "ngrok to expose your local endpoint to the internet. Please check out Appsmith's " +
                            "documentation to understand more.";
                    assertThat(
                            testResult.getMessages().stream()
                                    .anyMatch(message -> expectedMessage.equals(message))
                    ).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostUrlOnCreateEventOnApiDatasource() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("testName 2");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://localhost");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getMessages()).isNotEmpty();

                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running " +
                            "inside a docker container or on the cloud. To enable access to your localhost you may " +
                            "use ngrok to expose your local endpoint to the internet. Please check out Appsmith's " +
                            "documentation to understand more.";
                    assertThat(
                            createdDatasource.getMessages().stream()
                                    .anyMatch(message -> expectedMessage.equals(message))
                    ).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostUrlOnUpdateEventOnApiDatasource() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = new Datasource();
        datasource.setName("testName 3");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_ONLY);
        connection.setType(Connection.Type.REPLICA_SET);
        datasourceConfiguration.setConnection(connection);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        datasource.setOrganizationId(orgId);

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 -> {
                    Datasource updates = new Datasource();
                    DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
                    Connection connection1 = new Connection();
                    datasourceConfiguration1.setConnection(connection1);
                    datasourceConfiguration1.setUrl("http://localhost");
                    updates.setDatasourceConfiguration(datasourceConfiguration1);
                    return datasourceService.update(datasource1.getId(), updates);
                });

        StepVerifier
                .create(datasourceMono)
                .assertNext(updatedDatasource -> {
                    assertThat(updatedDatasource.getMessages().size()).isNotZero();
                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running " +
                            "inside a docker container or on the cloud. To enable access to your localhost you may " +
                            "use ngrok to expose your local endpoint to the internet. Please check out Appsmith's " +
                            "documentation to understand more.";
                    assertThat(
                            updatedDatasource.getMessages().stream()
                                    .anyMatch(message -> expectedMessage.equals(message))
                    ).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostUrlOnCreateEventOnNonApiDatasource() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("testName 4");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("http://localhost", 0L);
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        datasourceConfiguration.getEndpoints().add(endpoint);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getMessages()).isNotEmpty();

                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running " +
                            "inside a docker container or on the cloud. To enable access to your localhost you may " +
                            "use ngrok to expose your local endpoint to the internet. Please check out Appsmith's " +
                            "documentation to understand more.";
                    assertThat(
                            createdDatasource.getMessages().stream()
                                    .anyMatch(message -> expectedMessage.equals(message))
                    ).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostIPAddressOnUpdateEventOnNonApiDatasource() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = new Datasource();
        datasource.setName("testName 5");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_ONLY);
        connection.setType(Connection.Type.REPLICA_SET);
        datasourceConfiguration.setConnection(connection);
        datasource.setDatasourceConfiguration(datasourceConfiguration);

        datasource.setOrganizationId(orgId);

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 -> {
                    Datasource updates = new Datasource();
                    DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
                    Connection connection1 = new Connection();
                    datasourceConfiguration1.setConnection(connection1);
                    Endpoint endpoint = new Endpoint("http://127.0.0.1/xyz", 0L);
                    datasourceConfiguration1.setEndpoints(new ArrayList<>());
                    datasourceConfiguration1.getEndpoints().add(endpoint);
                    updates.setDatasourceConfiguration(datasourceConfiguration1);
                    return datasourceService.update(datasource1.getId(), updates);
                });

        StepVerifier
                .create(datasourceMono)
                .assertNext(updatedDatasource -> {
                    assertThat(updatedDatasource.getMessages().size()).isNotZero();
                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running " +
                            "inside a docker container or on the cloud. To enable access to your localhost you may " +
                            "use ngrok to expose your local endpoint to the internet. Please check out " +
                            "Appsmith's documentation to understand more.";
                    assertThat(
                            updatedDatasource.getMessages().stream()
                                    .anyMatch(message -> expectedMessage.equals(message))
                    ).isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageNPE() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("NPE check");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        Endpoint nullEndpoint = null;
        datasourceConfiguration.getEndpoints().add(nullEndpoint);
        Endpoint nullHost = new Endpoint(null, 0L);
        datasourceConfiguration.getEndpoints().add(nullHost);

        datasource.setDatasourceConfiguration(datasourceConfiguration);

        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create);

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getMessages()).isEmpty();
                })
                .verifyComplete();
    }
}
