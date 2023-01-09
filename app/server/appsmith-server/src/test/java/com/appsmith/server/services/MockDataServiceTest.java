package com.appsmith.server.services;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MockDataSource;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class MockDataServiceTest {

    @SpyBean
    PluginService pluginService;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    MockDataService mockDataService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    String workspaceId = "";

    Application testApp = null;

    PageDTO testPage = null;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {

        if (!StringUtils.hasLength(workspaceId)) {
            User apiUser = userService.findByEmail("api_user").block();
            Workspace toCreate = new Workspace();
            toCreate.setName("MockDataServiceTest");

            Workspace workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
        }


        if (testPage == null) {
            //Create application and page which will be used by the tests to create actions for.
            Application application = new Application();
            application.setName(UUID.randomUUID().toString());
            testApp = applicationPageService.createApplication(application, workspaceId).block();
            final String pageId = testApp.getPages().get(0).getId();
            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetMockDataSets() {
        StepVerifier
                .create(mockDataService.getMockDataSet())
                .assertNext(mockDataSets -> {
                    assertThat(mockDataSets.getMockdbs()).hasSize(2);
                    assertThat(mockDataSets.getMockdbs())
                            .anyMatch(data -> data.getName().equals("Movies") && data.getPackageName().equals("mongo-plugin"))
                            .anyMatch(data -> data.getName().equals("Users") && data.getPackageName().equals("postgres-plugin"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateMockDataSetsMongo() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("MockDataServiceTest testCreateMockDataSetsMongo");

        Workspace workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        String workspaceId = workspace.getId();

        Plugin pluginMono = pluginService.findByName("Installed Plugin Name").block();
        MockDataSource mockDataSource = new MockDataSource();
        mockDataSource.setName("Movies");
        mockDataSource.setWorkspaceId(workspaceId);
        mockDataSource.setPackageName("mongo-plugin");
        mockDataSource.setPluginId(pluginMono.getId());

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
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst().get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst().get();

        StepVerifier
                .create(mockDataService.createMockDataSet(mockDataSource))
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(pluginMono.getId());
                    assertThat(createdDatasource.getName()).isEqualTo("Movies");
                    Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                            .build();

                    DBAuth auth = (DBAuth) createdDatasource.getDatasourceConfiguration().getAuthentication();
                    assertThat(createdDatasource.getPolicies()).isNotEmpty();
                    assertThat(createdDatasource.getPolicies()).containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));
                    assertThat(createdDatasource.getDatasourceConfiguration().getProperties().get(0).getValue()).isEqualTo("Yes");
                    assertThat(createdDatasource.getDatasourceConfiguration().getProperties().get(0).getKey()).isEqualTo("Use Mongo Connection String URI");
                    assertThat(auth.getDatabaseName()).isEqualTo("movies");
                    assertThat(auth.getUsername()).isEqualTo("mockdb-admin");
                    Assertions.assertTrue(createdDatasource.getIsMock());
                    Assertions.assertNull(createdDatasource.getIsTemplate());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateMockDataSetsPostgres() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));


        Plugin pluginMono = pluginService.findByName("Installed Plugin Name").block();
        MockDataSource mockDataSource = new MockDataSource();
        mockDataSource.setName("Users");
        mockDataSource.setWorkspaceId(workspaceId);
        mockDataSource.setPackageName("postgres-plugin");
        mockDataSource.setPluginId(pluginMono.getId());

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
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst().get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst().get();

        StepVerifier
                .create(mockDataService.createMockDataSet(mockDataSource))
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(pluginMono.getId());
                    assertThat(createdDatasource.getName()).isEqualTo("Users");
                    Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                            .build();

                    DBAuth auth = (DBAuth) createdDatasource.getDatasourceConfiguration().getAuthentication();
                    assertThat(createdDatasource.getPolicies()).isNotEmpty();
                    assertThat(createdDatasource.getPolicies()).containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));
                    assertThat(auth.getDatabaseName()).isEqualTo("users");
                    assertThat(auth.getUsername()).isEqualTo("users");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateMockDataSetsDuplicateName() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("MockDataServiceTest testCreateMockDataSetsDuplicateName");

        Workspace workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        String workspaceId = workspace.getId();

        Plugin pluginMono = pluginService.findByName("Installed Plugin Name").block();

        MockDataSource mockDataSource = new MockDataSource();
        mockDataSource.setName("Movies");
        mockDataSource.setWorkspaceId(workspaceId);
        mockDataSource.setPackageName("mongo-plugin");
        mockDataSource.setPluginId(pluginMono.getId());

        Mono<Datasource> datasourceMono = mockDataService.createMockDataSet(mockDataSource)
                .flatMap(datasource -> mockDataService.createMockDataSet(mockDataSource));

        List<PermissionGroup> permissionGroups = Mono.just(workspace)
                .flatMapMany(savedWorkspace -> {
                    Set<String> defaultPermissionGroups = savedWorkspace.getDefaultPermissionGroups();
                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst().get();

        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst().get();

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(pluginMono.getId());
                    assertThat(createdDatasource.getName()).isEqualTo("Movies (1)");
                    Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId()))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                            .permissionGroups(Set.of(adminPermissionGroup.getId(), developerPermissionGroup.getId(), viewerPermissionGroup.getId()))
                            .build();

                    DBAuth auth = (DBAuth) createdDatasource.getDatasourceConfiguration().getAuthentication();
                    assertThat(createdDatasource.getPolicies()).isNotEmpty();
                    assertThat(createdDatasource.getPolicies()).containsAll(Set.of(manageDatasourcePolicy, readDatasourcePolicy, executeDatasourcePolicy));
                    assertThat(createdDatasource.getDatasourceConfiguration().getProperties().get(0).getValue()).isEqualTo("Yes");
                    assertThat(createdDatasource.getDatasourceConfiguration().getProperties().get(0).getKey()).isEqualTo("Use Mongo Connection String URI");
                    assertThat(auth.getDatabaseName()).isEqualTo("movies");
                    assertThat(auth.getUsername()).isEqualTo("mockdb-admin");
                })
                .verifyComplete();
    }
}
