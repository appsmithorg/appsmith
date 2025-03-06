package com.appsmith.server.services;

import com.appsmith.external.helpers.EncryptionHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Policy;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Slf4j
@DirtiesContext
public class DatasourceServiceTest {

    @Autowired
    DatasourceService datasourceService;

    @SpyBean
    DatasourceService spyDatasourceService;

    @SpyBean
    DatasourceStorageService datasourceStorageService;

    @Autowired
    PluginService pluginService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    UserService userService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    NewActionRepository newActionRepository;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    String workspaceId = "";
    private String defaultEnvironmentId;

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
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspaceId, permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void datasourceDefaultNameCounterAsPerWorkspaceId() {
        // Create new workspace
        Workspace workspace11 = new Workspace();
        workspace11.setId("random-org-id-1");
        workspace11.setName("Random Org 1");

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        StepVerifier.create(workspaceService
                        .create(workspace11)
                        .zipWith(pluginService.findByPackageName("restapi-plugin"))
                        .flatMap(tuple2 -> {
                            Workspace workspace = tuple2.getT1();
                            Plugin plugin = tuple2.getT2();
                            return workspaceService
                                    .getDefaultEnvironmentId(
                                            workspace.getId(), environmentPermission.getExecutePermission())
                                    .flatMap(environmentId -> {
                                        Datasource datasource = new Datasource();
                                        datasource.setWorkspaceId(workspace.getId());
                                        datasource.setPluginId(plugin.getId());
                                        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                                        storages.put(
                                                environmentId, new DatasourceStorageDTO(null, environmentId, null));
                                        datasource.setDatasourceStorages(storages);
                                        return datasourceService.create(datasource);
                                    });
                        })
                        .flatMap(datasource1 -> {
                            Workspace workspace2 = new Workspace();
                            workspace2.setId("random-org-id-2");
                            workspace2.setName("Random Org 2");
                            return Mono.zip(Mono.just(datasource1), workspaceService.create(workspace2));
                        })
                        .flatMap(tuple2 -> {
                            Datasource datasource1 = tuple2.getT1();
                            final Workspace workspace2 = tuple2.getT2();
                            return workspaceService
                                    .getDefaultEnvironmentId(
                                            workspace2.getId(), environmentPermission.getExecutePermission())
                                    .flatMap(environmentId -> {
                                        Datasource datasource2 = new Datasource();
                                        datasource2.setWorkspaceId(workspace2.getId());
                                        datasource2.setPluginId(datasource1.getPluginId());
                                        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                                        storages.put(
                                                environmentId, new DatasourceStorageDTO(null, environmentId, null));
                                        datasource2.setDatasourceStorages(storages);
                                        return Mono.zip(
                                                Mono.just(tuple2.getT1()), datasourceService.create(datasource2));
                                    });
                        }))
                .assertNext(datasource -> {
                    assertThat(datasource.getT1().getName()).isEqualTo("Untitled datasource");
                    assertThat(datasource.getT1().getWorkspaceId()).isEqualTo("random-org-id-1");
                    assertThat(datasource.getT1().getUserPermissions()).isNotEmpty();
                    assertThat(datasource.getT2().getName()).isEqualTo("Untitled datasource");
                    assertThat(datasource.getT2().getWorkspaceId()).isEqualTo("random-org-id-2");
                    assertThat(datasource.getT2().getUserPermissions()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithNullPluginId() {

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-createDatasourceWithNullPluginId");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();

            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
        Datasource datasource = new Datasource();
        datasource.setName("DS-with-null-pluginId");
        datasource.setWorkspaceId(workspaceId);
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, null));
        datasource.setDatasourceStorages(storages);

        StepVerifier.create(datasourceService.create(datasource))
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PLUGIN_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testValidateDatasource_createDatasourceWithNullWorkspaceId() {
        Datasource datasource = new Datasource();
        datasource.setName("DS-with-null-workspaceId");
        datasource.setPluginId("random plugin id");
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, null));
        datasource.setDatasourceStorages(storages);

        StepVerifier.create(datasourceService.validateDatasource(datasource))
                .assertNext(datasource1 -> {
                    assertThat(datasource1.getName()).isEqualTo(datasource.getName());
                    assertThat(datasource1.getIsValid()).isFalse();
                    assertThat(datasource1.getInvalids()).contains(AppsmithError.WORKSPACE_ID_NOT_GIVEN.getMessage());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithId() {
        Datasource datasource = new Datasource();
        datasource.setId("randomId");
        datasource.setWorkspaceId(workspaceId);
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, null));
        datasource.setDatasourceStorages(storages);

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Mono<Datasource> datasourceMono = pluginMono.flatMap(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasourceService.create(datasource);
        });

        StepVerifier.create(datasourceMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.DATASOURCE)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceNotInstalledPlugin() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-createDatasourceNotInstalledPlugin");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
        Mono<Plugin> pluginMono = pluginService.findByName("Not Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("DS-with-uninstalled-plugin");
        datasource.setWorkspaceId(workspaceId);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getUserPermissions()).isNotEmpty();
                    assertThat(createdDatasource.getIsValid()).isFalse();
                    assertThat(createdDatasource.getInvalids())
                            .contains("Plugin " + datasource.getPluginId() + " not installed");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceValid() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-createDatasourceValid");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        List<PermissionGroup> permissionGroups = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name");
        datasource.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getUserPermissions()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    Policy manageDatasourcePolicy = Policy.builder()
                            .permission(MANAGE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder()
                            .permission(READ_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder()
                            .permission(EXECUTE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();
                    Policy deleteDatasourcesPolicy = Policy.builder()
                            .permission(DELETE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();

                    assertThat(createdDatasource.getPolicies()).isNotEmpty();
                    assertThat(createdDatasource.getPolicies())
                            .containsAll(Set.of(
                                    manageDatasourcePolicy,
                                    readDatasourcePolicy,
                                    executeDatasourcePolicy,
                                    deleteDatasourcesPolicy));

                    Assertions.assertNull(createdDatasource.getIsMock());
                    Assertions.assertNull(createdDatasource.getIsTemplate());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createAndUpdateDatasourceValidDB() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-createAndUpdateDatasourceValidDB");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Datasource datasource = new Datasource();
        datasource.setName("test db datasource");
        datasource.setWorkspaceId(workspaceId);
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

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 -> {
                    DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
                    Connection connection1 = new Connection();
                    SSLDetails ssl = new SSLDetails();
                    ssl.setKeyFile(new UploadedFile());
                    ssl.getKeyFile().setName("ssl_key_file_id2");
                    connection1.setSsl(ssl);
                    datasourceConfiguration1.setConnection(connection1);

                    DatasourceStorageDTO datasourceStorageDTO = new DatasourceStorageDTO(
                            datasource1.getId(), defaultEnvironmentId, datasourceConfiguration1);
                    return datasourceService.updateDatasourceStorage(
                            datasourceStorageDTO, defaultEnvironmentId, Boolean.FALSE);
                });

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getDatasourceStorages()).containsKey(defaultEnvironmentId);
                    assertThat(createdDatasource
                                    .getDatasourceStorages()
                                    .get(defaultEnvironmentId)
                                    .getDatasourceConfiguration()
                                    .getConnection()
                                    .getSsl()
                                    .getKeyFile()
                                    .getName())
                            .isEqualTo("ssl_key_file_id2");
                    assertThat(createdDatasource.getUserPermissions()).isNotEmpty();
                    assertThat(createdDatasource.getUserPermissions())
                            .containsAll(Set.of(
                                    READ_DATASOURCES.getValue(), EXECUTE_DATASOURCES.getValue(),
                                    MANAGE_DATASOURCES.getValue(), DELETE_DATASOURCES.getValue()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createAndUpdateDatasourceDifferentAuthentication() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-createAndUpdateDatasourceDifferentAuthentication");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
        }

        Datasource datasource = new Datasource();
        datasource.setWorkspaceId(workspaceId);
        datasource.setName("test db datasource1");
        datasource.setWorkspaceId(workspaceId);

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

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 -> {
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
                    datasource1.setDatasourceConfiguration(datasourceConfiguration1);

                    DatasourceStorageDTO datasourceStorageDTO = new DatasourceStorageDTO(
                            datasource1.getId(), defaultEnvironmentId, datasourceConfiguration1);
                    return datasourceService.updateDatasourceStorage(
                            datasourceStorageDTO, defaultEnvironmentId, Boolean.FALSE);
                });

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getDatasourceStorages().get(defaultEnvironmentId))
                            .isNotNull();
                    DatasourceConfiguration datasourceConfiguration1 = createdDatasource
                            .getDatasourceStorages()
                            .get(defaultEnvironmentId)
                            .getDatasourceConfiguration();

                    assertThat(datasourceConfiguration1
                                    .getConnection()
                                    .getSsl()
                                    .getKeyFile()
                                    .getName())
                            .isEqualTo("ssl_key_file_id2");
                    assertThat(datasourceConfiguration1.getAuthentication() instanceof OAuth2)
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createNamelessDatasource() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-createNamelessDatasource");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");

        Datasource datasource1 = new Datasource();
        datasource1.setWorkspaceId(workspaceId);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
        storages1.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource1.setDatasourceStorages(storages1);

        Datasource datasource2 = new Datasource();
        datasource2.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration2 = new DatasourceConfiguration();
        datasourceConfiguration2.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages2 = new HashMap<>();
        storages2.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration2));
        datasource2.setDatasourceStorages(storages2);

        final Mono<Tuple2<Datasource, Datasource>> datasourcesMono = pluginMono
                .flatMap(plugin -> {
                    datasource1.setPluginId(plugin.getId());
                    datasource2.setPluginId(plugin.getId());
                    return datasourceService.create(datasource1);
                })
                .zipWhen(datasource -> datasourceService.create(datasource2));

        StepVerifier.create(datasourcesMono)
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

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-testDatasourceValid");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name for test");
        datasource.setWorkspaceId(workspaceId);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<DatasourceTestResult> testResultMono = datasourceMono.flatMap(datasource1 -> {
            DatasourceStorageDTO datasourceStorageDTO =
                    datasource1.getDatasourceStorages().get(defaultEnvironmentId);
            datasourceStorageDTO.setPluginId(datasource.getPluginId());
            return datasourceService.testDatasource(datasourceStorageDTO, defaultEnvironmentId);
        });

        StepVerifier.create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testDatasourceEmptyFields() {

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-testDatasourceEmptyFields");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");

        Datasource datasource = new Datasource();
        datasource.setName("test db datasource empty");
        datasource.setWorkspaceId(workspaceId);

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

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<DatasourceTestResult> testResultMono = datasourceMono.flatMap(datasource1 -> {
            DatasourceStorageDTO datasourceStorageDTO =
                    datasource1.getDatasourceStorages().get(defaultEnvironmentId);
            ((DBAuth) datasourceStorageDTO.getDatasourceConfiguration().getAuthentication()).setPassword(null);
            datasourceStorageDTO.setPluginId(datasource.getPluginId());
            return datasourceService.testDatasource(datasourceStorageDTO, defaultEnvironmentId);
        });

        StepVerifier.create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteDatasourceWithoutActions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-deleteDatasourceWithoutActions");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setWorkspaceId(workspaceId);
        datasource.setName("test datasource name for deletion");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);
        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 -> datasourceService.archiveById(datasource1.getId()));

        StepVerifier.create(datasourceMono)
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
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        String name = "DatasourceServiceTest-deleteDatasourceWithActions";

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName(name);

        Workspace createdWorkspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        String workspaceId = createdWorkspace.getId();
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Mono<Datasource> datasourceMono = Mono.zip(
                        workspaceRepository.findByName(name, AclPermission.READ_WORKSPACES),
                        pluginService.findByPackageName("restapi-plugin"))
                .flatMap(objects -> {
                    final Workspace workspace = objects.getT1();
                    final Plugin plugin = objects.getT2();

                    Datasource datasource = new Datasource();
                    datasource.setWorkspaceId(workspace.getId());
                    datasource.setPluginId(plugin.getId());
                    datasource.setName("test datasource name for deletion with actions");

                    DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
                    datasourceConfiguration.setUrl("http://test.com");

                    HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                    storages.put(
                            defaultEnvironmentId,
                            new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
                    datasource.setDatasourceStorages(storages);

                    final Application application = new Application();
                    application.setName("application 1");

                    return Mono.zip(
                            Mono.just(workspace),
                            Mono.just(plugin),
                            datasourceService.create(datasource),
                            applicationPageService
                                    .createApplication(application, workspace.getId())
                                    .flatMap(application1 -> {
                                        final PageDTO page = new PageDTO();
                                        page.setName("test page 1");
                                        page.setApplicationId(application1.getId());
                                        page.setPolicies(new HashSet<>(Set.of(Policy.builder()
                                                .permission(READ_PAGES.getValue())
                                                .build())));
                                        return applicationPageService.createPage(page);
                                    }));
                })
                .flatMap(objects -> {
                    final Datasource datasource = objects.getT3();
                    final PageDTO page = objects.getT4();

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setWorkspaceId(objects.getT1().getId());
                    action.setPluginId(objects.getT2().getId());
                    action.setPageId(page.getId());
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    return layoutActionService
                            .createSingleAction(action, Boolean.FALSE)
                            .thenReturn(datasource);
                })
                .flatMap(datasource -> datasourceService.archiveById(datasource.getId()));

        StepVerifier.create(datasourceMono)
                .verifyErrorMessage(AppsmithError.DATASOURCE_HAS_ACTIONS.getMessage("1", "query"));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteDatasourceWithDeletedActions() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        String name = "DatasourceServiceTest-deleteDatasourceWithDeletedActions";
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName(name);

        Workspace createdWorkspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        String workspaceId = createdWorkspace.getId();
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Mono<Datasource> datasourceMono = Mono.zip(
                        workspaceRepository.findByName(name, AclPermission.READ_WORKSPACES),
                        pluginService.findByPackageName("restapi-plugin"))
                .flatMap(objects -> {
                    final Workspace workspace = objects.getT1();
                    final Plugin plugin = objects.getT2();

                    Datasource datasource = new Datasource();
                    datasource.setWorkspaceId(workspace.getId());
                    datasource.setPluginId(plugin.getId());
                    datasource.setName("test datasource name for deletion with deleted actions");

                    DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
                    datasourceConfiguration.setUrl("http://test.com");

                    HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                    storages.put(
                            defaultEnvironmentId,
                            new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
                    datasource.setDatasourceStorages(storages);

                    final Application application = new Application();
                    application.setName("application 2");

                    return Mono.zip(
                            Mono.just(workspace),
                            Mono.just(plugin),
                            datasourceService.create(datasource),
                            applicationPageService
                                    .createApplication(application, workspace.getId())
                                    .zipWhen(application1 -> {
                                        final PageDTO page = new PageDTO();
                                        page.setName("test page 1");
                                        page.setApplicationId(application1.getId());
                                        page.setPolicies(new HashSet<>(Set.of(Policy.builder()
                                                .permission(READ_PAGES.getValue())
                                                .build())));
                                        return applicationPageService.createPage(page);
                                    }));
                })
                .flatMap(objects -> {
                    final Datasource datasource = objects.getT3();
                    final Application application = objects.getT4().getT1();
                    final PageDTO page = objects.getT4().getT2();

                    ActionDTO action = new ActionDTO();
                    action.setName("validAction");
                    action.setWorkspaceId(objects.getT1().getId());
                    action.setPluginId(objects.getT2().getId());
                    action.setPageId(page.getId());
                    ActionConfiguration actionConfiguration = new ActionConfiguration();
                    actionConfiguration.setHttpMethod(HttpMethod.GET);
                    action.setActionConfiguration(actionConfiguration);
                    action.setDatasource(datasource);

                    return layoutActionService
                            .createSingleAction(action, Boolean.FALSE)
                            .then(applicationPageService.deleteApplication(application.getId()))
                            .thenReturn(datasource);
                })
                .flatMap(datasource -> datasourceService.archiveById(datasource.getId()));

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getName())
                            .isEqualTo("test datasource name for deletion with deleted actions");
                    assertThat(createdDatasource.getDeletedAt()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkEncryptionOfAuthenticationDTOTest() {
        // For this test, simply inserting a new datasource with authentication should immediately
        // set the authentication object as encrypted
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-checkEncryptionOfAuthenticationDTOTest");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setWorkspaceId(workspaceId);
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

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        StepVerifier.create(datasourceMono)
                .assertNext(savedDatasource -> {
                    DatasourceStorageDTO datasourceStorageDTO =
                            savedDatasource.getDatasourceStorages().get(defaultEnvironmentId);
                    DBAuth authentication = (DBAuth)
                            datasourceStorageDTO.getDatasourceConfiguration().getAuthentication();
                    assertThat(authentication.getUsername()).isEqualTo(username);
                    assertThat(EncryptionHelper.decrypt(authentication.getPassword()))
                            .isEqualTo(password);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkEncryptionOfAuthenticationDTONullPassword() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-checkEncryptionOfAuthenticationDTONullPassword");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setWorkspaceId(workspaceId);
        datasource.setName("test datasource name for authenticated fields encryption test null password.");

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        authenticationDTO.setDatabaseName("admin");
        datasourceConfiguration.setAuthentication(authenticationDTO);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<DatasourceStorage> datasourceStorageMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 ->
                        datasourceStorageService.findByDatasourceAndEnvironmentId(datasource1, defaultEnvironmentId));

        StepVerifier.create(datasourceStorageMono)
                .assertNext(savedDatasource -> {
                    DBAuth authentication = (DBAuth)
                            savedDatasource.getDatasourceConfiguration().getAuthentication();
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
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-checkEncryptionOfAuthenticationDTOAfterUpdate");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setWorkspaceId(workspaceId);
        datasource.setName("test datasource name for authenticated fields encryption test post update");

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        String username = "username";
        String password = "password";
        authenticationDTO.setUsername(username);
        authenticationDTO.setPassword(password);
        datasourceConfiguration.setAuthentication(authenticationDTO);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource createdDatasource = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .block();

        Mono<Datasource> datasourceMono = Mono.just(createdDatasource).flatMap(original -> {
            // Here we still need to send some object of authentication type to make sure that the entire object is not
            // replaced by null
            DBAuth partialAuthenticationDTO = new DBAuth();
            partialAuthenticationDTO.setUsername(username);
            datasourceConfiguration.setAuthentication(partialAuthenticationDTO);
            original.getDatasourceStorages()
                    .get(defaultEnvironmentId)
                    .setDatasourceConfiguration(datasourceConfiguration);

            DatasourceStorageDTO datasourceStorageDTO =
                    new DatasourceStorageDTO(original.getId(), defaultEnvironmentId, datasourceConfiguration);
            return datasourceService.updateDatasourceStorage(datasourceStorageDTO, defaultEnvironmentId, Boolean.FALSE);
        });

        StepVerifier.create(datasourceMono)
                .assertNext(updatedDatasource -> {
                    DatasourceStorageDTO datasourceStorageDTO =
                            updatedDatasource.getDatasourceStorages().get(defaultEnvironmentId);
                    DBAuth authentication = (DBAuth)
                            datasourceStorageDTO.getDatasourceConfiguration().getAuthentication();

                    assertThat(authentication.getUsername()).isEqualTo(username);
                    assertThat(password).isEqualTo(EncryptionHelper.decrypt(authentication.getPassword()));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void checkEncryptionOfAuthenticationDTOAfterRemoval() {
        // Here is when authentication is removed from a datasource
        // We want the entire authentication object to be discarded here to avoid reusing any sensitive data across
        // types
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-checkEncryptionOfAuthenticationDTOAfterRemoval");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Mono<Plugin> pluginMono = pluginService.findByPackageName("postgres-plugin");
        Datasource datasource = new Datasource();
        datasource.setWorkspaceId(workspaceId);
        datasource.setName("test datasource name for authenticated fields encryption test post removal");

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        DBAuth authenticationDTO = new DBAuth();
        String username = "username";
        String password = "password";
        authenticationDTO.setUsername(username);
        authenticationDTO.setPassword(password);
        datasourceConfiguration.setAuthentication(authenticationDTO);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Datasource createdDatasource = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .block();

        Mono<Datasource> datasourceMono = Mono.just(createdDatasource).flatMap(original -> {
            Datasource datasource1 = new Datasource();
            // Here we abstain from sending an authentication object to remove the field from datasourceConfiguration
            DatasourceConfiguration datasourceConfiguration2 = new DatasourceConfiguration();
            datasourceConfiguration2.setUrl("http://test.com");
            datasource1.setDatasourceConfiguration(datasourceConfiguration2);
            datasource1.setName("New Name for update to test that encryption is now gone");
            return datasourceService.save(datasource1, false);
        });

        StepVerifier.create(datasourceMono)
                .assertNext(updatedDatasource -> {
                    assertThat(updatedDatasource.getDatasourceConfiguration().getAuthentication())
                            .isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithInvalidCharsInHost() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("DatasourceServiceTest-createDatasourceWithInvalidCharsInHost");

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        String workspaceId = workspace.getId();
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Mono<Workspace> workspaceResponse = workspaceService.findById(workspaceId, READ_WORKSPACES);

        List<PermissionGroup> permissionGroups = workspaceResponse
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Mono<Plugin> pluginMono = pluginService.findByPackageName("postgres-plugin");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name with invalid hostnames");
        datasource.setWorkspaceId(workspaceId);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        datasourceConfiguration.getEndpoints().add(new Endpoint("hostname/", 5432L));
        datasourceConfiguration.getEndpoints().add(new Endpoint("hostname:", 5432L));

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    assertThat(createdDatasource.getInvalids()).isEmpty();

                    Policy manageDatasourcePolicy = Policy.builder()
                            .permission(MANAGE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder()
                            .permission(READ_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder()
                            .permission(EXECUTE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(
                                    adminPermissionGroup.getId(),
                                    developerPermissionGroup.getId(),
                                    viewerPermissionGroup.getId()))
                            .build();

                    assertThat(createdDatasource.getPolicies()).isNotEmpty();
                    assertThat(createdDatasource.getPolicies())
                            .containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createDatasourceWithHostnameStartingWithSpace() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-createDatasourceWithHostnameStartingWithSpace");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setName("test datasource name with hostname starting/ending with space");
        datasource.setWorkspaceId(workspaceId);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        datasourceConfiguration.getEndpoints().add(new Endpoint(" hostname ", 5432L));

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(datasource.getPluginId());
                    assertThat(createdDatasource.getName()).isEqualTo(datasource.getName());
                    DatasourceStorageDTO datasourceStorageDTO =
                            createdDatasource.getDatasourceStorages().get(defaultEnvironmentId);
                    assertThat(datasourceStorageDTO.getInvalids()).isEmpty();
                    assertThat(datasourceStorageDTO.getDatasourceConfiguration().getEndpoints())
                            .isEqualTo(List.of(new Endpoint("hostname", 5432L)));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostUrlOnTestDatasourceEvent() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-testHintMessageOnLocalhostUrlOnTestDatasourceEvent");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setName("testName 1");
        datasource.setWorkspaceId(workspaceId);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("http://localhost", 0L);
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        datasourceConfiguration.getEndpoints().add(endpoint);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<DatasourceTestResult> testResultMono = datasourceMono.flatMap(datasource1 -> {
            DatasourceStorageDTO datasourceStorageDTO =
                    datasource1.getDatasourceStorages().get(defaultEnvironmentId);
            datasourceStorageDTO.setPluginId(datasource.getPluginId());
            return datasourceService.testDatasource(datasourceStorageDTO, defaultEnvironmentId);
        });

        StepVerifier.create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isEmpty();
                    assertThat(testResult.getMessages()).isNotEmpty();

                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running "
                            + "inside a docker container or on the cloud. To enable access to your localhost you may use "
                            + "ngrok to expose your local endpoint to the internet. Please check out Appsmith's "
                            + "documentation to understand more.";
                    assertThat(testResult.getMessages().stream().anyMatch(message -> expectedMessage.equals(message)))
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostUrlOnCreateEventOnApiDatasource() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-testHintMessageOnLocalhostUrlOnCreateEventOnApiDatasource");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setName("testName 2");
        datasource.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://localhost");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    DatasourceStorageDTO datasourceStorageDTO =
                            createdDatasource.getDatasourceStorages().get(defaultEnvironmentId);
                    assertThat(datasourceStorageDTO.getMessages()).isNotEmpty();

                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running "
                            + "inside a docker container or on the cloud. To enable access to your localhost you may "
                            + "use ngrok to expose your local endpoint to the internet. Please check out Appsmith's "
                            + "documentation to understand more.";
                    assertThat(datasourceStorageDTO.getMessages()).containsExactly(expectedMessage);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostUrlOnUpdateEventOnApiDatasource() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-testHintMessageOnLocalhostUrlOnUpdateEventOnApiDatasource");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");

        Datasource datasource = new Datasource();
        datasource.setName("testName 3");
        datasource.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_ONLY);
        connection.setType(Connection.Type.REPLICA_SET);
        datasourceConfiguration.setConnection(connection);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        datasource.setWorkspaceId(workspaceId);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 -> {
                    DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
                    Connection connection1 = new Connection();
                    datasourceConfiguration1.setConnection(connection1);
                    datasourceConfiguration1.setUrl("http://localhost");
                    datasource1
                            .getDatasourceStorages()
                            .get(defaultEnvironmentId)
                            .setDatasourceConfiguration(datasourceConfiguration1);

                    DatasourceStorageDTO datasourceStorageDTO = new DatasourceStorageDTO(
                            datasource1.getId(), defaultEnvironmentId, datasourceConfiguration1);
                    return datasourceService.updateDatasourceStorage(
                            datasourceStorageDTO, defaultEnvironmentId, Boolean.FALSE);
                });

        StepVerifier.create(datasourceMono)
                .assertNext(updatedDatasource -> {
                    DatasourceStorageDTO datasourceStorageDTO =
                            updatedDatasource.getDatasourceStorages().get(defaultEnvironmentId);
                    assertThat(datasourceStorageDTO.getMessages().size()).isNotZero();
                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running "
                            + "inside a docker container or on the cloud. To enable access to your localhost you may "
                            + "use ngrok to expose your local endpoint to the internet. Please check out Appsmith's "
                            + "documentation to understand more.";
                    assertThat(datasourceStorageDTO.getMessages()).containsExactly(expectedMessage);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostUrlOnCreateEventOnNonApiDatasource() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("testName 4");
        datasource.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("http://localhost", 0L);
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        datasourceConfiguration.getEndpoints().add(endpoint);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    DatasourceStorageDTO datasourceStorageDTO =
                            createdDatasource.getDatasourceStorages().get(defaultEnvironmentId);
                    assertThat(datasourceStorageDTO.getMessages()).isNotEmpty();

                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running "
                            + "inside a docker container or on the cloud. To enable access to your localhost you may "
                            + "use ngrok to expose your local endpoint to the internet. Please check out Appsmith's "
                            + "documentation to understand more.";
                    assertThat(datasourceStorageDTO.getMessages()).containsExactly(expectedMessage);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageOnLocalhostIPAddressOnUpdateEventOnNonApiDatasource() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName(
                    "DatasourceServiceTest-testHintMessageOnLocalhostIPAddressOnUpdateEventOnNonApiDatasource");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }

        Datasource datasource = new Datasource();
        datasource.setName("testName 5");
        datasource.setWorkspaceId(workspaceId);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_ONLY);
        connection.setType(Connection.Type.REPLICA_SET);
        datasourceConfiguration.setConnection(connection);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create)
                .flatMap(datasource1 -> {
                    DatasourceConfiguration datasourceConfiguration1 = new DatasourceConfiguration();
                    Connection connection1 = new Connection();
                    datasourceConfiguration1.setConnection(connection1);
                    Endpoint endpoint = new Endpoint("http://127.0.0.1/xyz", 0L);
                    datasourceConfiguration1.setEndpoints(new ArrayList<>());
                    datasourceConfiguration1.getEndpoints().add(endpoint);
                    datasource1
                            .getDatasourceStorages()
                            .get(defaultEnvironmentId)
                            .setDatasourceConfiguration(datasourceConfiguration1);

                    DatasourceStorageDTO datasourceStorageDTO = new DatasourceStorageDTO(
                            datasource1.getId(), defaultEnvironmentId, datasourceConfiguration1);
                    return datasourceService.updateDatasourceStorage(
                            datasourceStorageDTO, defaultEnvironmentId, Boolean.FALSE);
                });

        StepVerifier.create(datasourceMono)
                .assertNext(updatedDatasource -> {
                    DatasourceStorageDTO datasourceStorageDTO =
                            updatedDatasource.getDatasourceStorages().get(defaultEnvironmentId);
                    assertThat(datasourceStorageDTO.getMessages().size()).isNotZero();
                    String expectedMessage = "You may not be able to access your localhost if Appsmith is running "
                            + "inside a docker container or on the cloud. To enable access to your localhost you may "
                            + "use ngrok to expose your local endpoint to the internet. Please check out "
                            + "Appsmith's documentation to understand more.";
                    assertThat(datasourceStorageDTO.getMessages()).containsExactly(expectedMessage);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testHintMessageNPE() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("DatasourceServiceTest-testHintMessageNPE");

            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                    .block();
        }
        Mono<Plugin> pluginMono = pluginService.findByPackageName("restapi-plugin");
        Datasource datasource = new Datasource();
        datasource.setName("NPE check");
        datasource.setWorkspaceId(workspaceId);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(new ArrayList<>());
        Endpoint nullEndpoint = null;
        datasourceConfiguration.getEndpoints().add(nullEndpoint);
        Endpoint nullHost = new Endpoint(null, 0L);
        datasourceConfiguration.getEndpoints().add(nullHost);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        Mono<Datasource> datasourceMono = pluginMono
                .map(plugin -> {
                    datasource.setPluginId(plugin.getId());
                    return datasource;
                })
                .flatMap(datasourceService::create);

        StepVerifier.create(datasourceMono)
                .assertNext(createdDatasource -> {
                    DatasourceStorageDTO datasourceStorageDTO =
                            createdDatasource.getDatasourceStorages().get(defaultEnvironmentId);
                    assertThat(datasourceStorageDTO.getMessages()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void get_WhenDatasourcesPresent_SortedAndIsRecentlyCreatedFlagSet() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace toCreate = new Workspace();
        toCreate.setName("DatasourceServiceTest : get_WhenDatasourcesPresent_SortedAndIsRecentlyCreatedFlagSet");

        Workspace workspace = workspaceService.create(toCreate).block();
        String workspaceId = workspace.getId();

        List<Datasource> datasourceList = List.of(
                createDatasource("D", workspaceId), // should have isRecentlyCreated=false
                createDatasource("C", workspaceId), // should have isRecentlyCreated=true
                createDatasource("B", workspaceId), // should have isRecentlyCreated=true
                createDatasource("A", workspaceId) // should have isRecentlyCreated=true
                );

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add(Datasource.Fields.workspaceId, workspaceId);

        Mono<List<Datasource>> listMono =
                datasourceService.getAllWithStorages(params).collectList();

        StepVerifier.create(listMono)
                .assertNext(datasources -> {
                    assertThat(datasources).hasSize(4);

                    assertThat(datasources).allMatch(datasourceDTO -> Set.of("A", "B", "C", "D")
                            .contains(datasourceDTO.getName()));

                    datasources.stream().forEach(datasource -> {
                        if (Set.of("A", "B", "C").contains(datasource.getName())) {
                            assertThat(datasource.getIsRecentlyCreated()).isTrue();
                        } else {
                            assertThat(datasource.getIsRecentlyCreated()).isNull();
                        }
                    });
                })
                .verifyComplete();
    }

    private Datasource createDatasource(String name, String workspaceId) {

        Plugin plugin = pluginService.findByPackageName("restapi-plugin").block();
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Datasource datasource = new Datasource();
        datasource.setPluginId(plugin.getId());
        datasource.setWorkspaceId(workspaceId);
        datasource.setName(name);

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, null));
        datasource.setDatasourceStorages(storages);
        Datasource createdDatasource = datasourceService.create(datasource).block();
        return createdDatasource;
    }

    private Datasource createDatasourceObject(String name, String workspaceId, String pluginName) {
        Datasource datasource = new Datasource();
        datasource.setName(name);
        datasource.setWorkspaceId(workspaceId);

        Plugin plugin = pluginService.findByPackageName(pluginName).block();
        datasource.setPluginName(pluginName);
        datasource.setPluginId(plugin.getId());

        return datasource;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getErrorOnCreatingEmptyDatasource() {
        Datasource datasource = createDatasourceObject("testDs", workspaceId, "postgres-plugin");
        Mono<Datasource> datasourceMono = datasourceService.create(datasource);

        StepVerifier.create(datasourceMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithErrorCode.INVALID_PARAMETER.getCode());
        });
    }

    public DatasourceStorageDTO generateSampleDatasourceStorageDTO() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("https://sample.endpoint", 5432L);
        DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("password");
        dbAuth.setUsername("username");
        dbAuth.setDatabaseName("databaseName");

        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setAuthentication(dbAuth);
        return new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration);
    }

    /**
     *  This is commented out because of a different implementation in EE codebase, will figure out how to fix that
     *  without mocking the featureFlag.
     */
    // @Test
    // @WithUserDetails(value = "api_user")
    public void verifyOnlyOneStorageIsSaved() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = createDatasourceObject("testDs", workspaceId, "postgres-plugin");
        datasource.getDatasourceStorages().put("randomName", generateSampleDatasourceStorageDTO());
        datasource.getDatasourceStorages().put("randomName2", generateSampleDatasourceStorageDTO());

        Mono<Datasource> datasourceMono = datasourceService.create(datasource);

        StepVerifier.create(datasourceMono)
                .assertNext(dbDatasource -> {
                    assertThat(dbDatasource.getDatasourceStorages()).hasSize(1);
                    assertThat(dbDatasource.getDatasourceStorages().get(defaultEnvironmentId))
                            .isNotNull();
                    DatasourceStorageDTO datasourceStorageDTO =
                            dbDatasource.getDatasourceStorages().get(defaultEnvironmentId);
                    assertThat(datasourceStorageDTO.getDatasourceId()).isEqualTo(dbDatasource.getId());
                    assertThat(datasourceStorageDTO.getEnvironmentId()).isEqualTo(defaultEnvironmentId);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUpdateNameReturnsNullStorages() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = createDatasourceObject("testDs", workspaceId, "postgres-plugin");
        datasource.getDatasourceStorages().put(defaultEnvironmentId, generateSampleDatasourceStorageDTO());
        Datasource createdDatasource = datasourceService.create(datasource).block();

        createdDatasource.setName("renamedDs");
        Mono<Datasource> datasourceMono = datasourceService.updateDatasource(
                createdDatasource.getId(), createdDatasource, defaultEnvironmentId, Boolean.FALSE);

        StepVerifier.create(datasourceMono)
                .assertNext(dbDatasource -> {
                    assertThat(dbDatasource.getDatasourceStorages()).isNull();
                    assertThat(dbDatasource.getName()).isEqualTo("renamedDs");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUpdateDatasourceStorageWithoutDatasourceId() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = createDatasourceObject("testDs", workspaceId, "postgres-plugin");
        datasource.getDatasourceStorages().put(defaultEnvironmentId, generateSampleDatasourceStorageDTO());
        Datasource createdDatasource = datasourceService.create(datasource).block();

        // this doesn't have the datasourceId yet
        DatasourceStorageDTO sampleDatasourceStorageDTO = generateSampleDatasourceStorageDTO();
        sampleDatasourceStorageDTO.setWorkspaceId(createdDatasource.getWorkspaceId());
        sampleDatasourceStorageDTO.setPluginId(createdDatasource.getPluginId());

        Mono<Datasource> datasourceMono = datasourceService.updateDatasourceStorage(
                sampleDatasourceStorageDTO, defaultEnvironmentId, Boolean.FALSE);

        StepVerifier.create(datasourceMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithErrorCode.INVALID_PARAMETER.getCode());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyTestDatasourceWithSavedDatasourceButNoDatasourceStorageSucceeds() {
        Datasource datasource = createDatasourceObject("sampleDatasource", workspaceId, "postgres-plugin");
        DatasourceStorageDTO datasourceStorageDTO = generateSampleDatasourceStorageDTO();
        datasource.getDatasourceStorages().put(defaultEnvironmentId, datasourceStorageDTO);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        DatasourceStorage datasourceStorage =
                datasourceStorageService.createDatasourceStorageFromDatasourceStorageDTO(datasourceStorageDTO);
        Mockito.doReturn(Mono.just(datasourceStorage))
                .when(datasourceStorageService)
                .create(Mockito.any(), Mockito.anyBoolean());
        Datasource dbDatasource = datasourceService.create(datasource).block();

        assertThat(dbDatasource.getId()).isNotNull();
        assertThat(dbDatasource.getDatasourceStorages()).isNotNull();
        assertThat(dbDatasource.getDatasourceStorages().get(defaultEnvironmentId))
                .isNotNull();
        assertThat(dbDatasource
                        .getDatasourceStorages()
                        .get(defaultEnvironmentId)
                        .getId())
                .isNull();

        datasourceStorageDTO.setDatasourceId(dbDatasource.getId());
        datasourceStorageDTO.setWorkspaceId(workspaceId);
        datasourceStorageDTO.setPluginId(dbDatasource.getPluginId());

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mono<DatasourceTestResult> testResultMono =
                datasourceService.testDatasource(datasourceStorageDTO, defaultEnvironmentId);

        StepVerifier.create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyTestDatasourceWithoutSavedDatasource() {
        Datasource datasource = createDatasourceObject("sampleDatasource", workspaceId, "postgres-plugin");
        DatasourceStorageDTO datasourceStorageDTO = generateSampleDatasourceStorageDTO();

        datasourceStorageDTO.setWorkspaceId(workspaceId);
        datasourceStorageDTO.setPluginId(datasource.getPluginId());

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mono<DatasourceTestResult> testResultMono =
                datasourceService.testDatasource(datasourceStorageDTO, defaultEnvironmentId);

        StepVerifier.create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyTestDatasource_withRateLimitExceeded_returnsTooManyRequests() {
        Datasource datasource = createDatasourceObject("sampleDatasource", workspaceId, "postgres-plugin");
        DatasourceStorageDTO datasourceStorageDTO = generateSampleDatasourceStorageDTO();

        datasourceStorageDTO.setWorkspaceId(workspaceId);
        datasourceStorageDTO.setPluginId(datasource.getPluginId());

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.doReturn(Mono.just(true))
                .when(spyDatasourceService)
                .isEndpointBlockedForConnectionRequest(Mockito.any());
        Mono<DatasourceTestResult> testResultMono =
                spyDatasourceService.testDatasource(datasourceStorageDTO, defaultEnvironmentId);

        String expectedErrorMessage = "Too many failed requests received. Please try again after 5 minutes";

        StepVerifier.create(testResultMono)
                .assertNext(testResult -> {
                    assertThat(testResult).isNotNull();
                    assertThat(testResult.getInvalids()).isNotEmpty();
                    assertThat(testResult.getInvalids().contains(expectedErrorMessage))
                            .isTrue();
                })
                .verifyComplete();
    }
}
