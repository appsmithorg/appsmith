package com.appsmith.server.services;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.MockDataSource;
import com.appsmith.server.dtos.PageDTO;
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
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class MockDataServiceTest {

    @SpyBean
    PluginService pluginService;

    @Autowired
    OrganizationRepository organizationRepository;

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
    OrganizationService organizationService;

    @Autowired
    NewActionService newActionService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    String orgId = "";

    Application testApp = null;

    PageDTO testPage = null;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        orgId = testOrg == null ? "" : testOrg.getId();
        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
        Organization organization = organizationService.getById(orgId).block();

        if (testPage == null) {
            //Create application and page which will be used by the tests to create actions for.
            Application application = new Application();
            application.setName(UUID.randomUUID().toString());
            testApp = applicationPageService.createApplication(application, organization.getId()).block();
            final String pageId = testApp.getPages().get(0).getId();
            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();
        }
    }
    @Test
    @WithUserDetails(value = "api_user")
    public void testGetMockDataSets() {
        StepVerifier
                .create(mockDataService.getMockDataSet())
                .assertNext( mockDataSets -> {
                    assertThat(mockDataSets.getMockdbs().size()).isEqualTo(2);
                    assertThat(mockDataSets.getMockdbs().stream().anyMatch(data -> {
                        return data.getName().equals("movies") &&
                                data.getPackageName().equals("mongo-plugin");
                    }));
                    assertThat(mockDataSets.getMockdbs().stream().anyMatch(data -> {
                        return data.getName().equals("users") &&
                                data.getPackageName().equals("postgres-plugin");
                    }));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateMockDataSetsMongo() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Plugin pluginMono = pluginService.findByName("Installed Plugin Name").block();
        MockDataSource mockDataSource = new MockDataSource();
        mockDataSource.setName("Movies");
        mockDataSource.setOrganizationId(orgId);
        mockDataSource.setPackageName("mongo-plugin");
        mockDataSource.setPluginId(pluginMono.getId());

        StepVerifier
                .create(mockDataService.createMockDataSet(mockDataSource))
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(pluginMono.getId());
                    assertThat(createdDatasource.getName()).isEqualTo("Movies (2)");
                    Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
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

    @Test
    @WithUserDetails(value = "api_user")
    public void testCreateMockDataSetsPostgres() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Plugin pluginMono = pluginService.findByName("Installed Plugin Name").block();
        MockDataSource mockDataSource = new MockDataSource();
        mockDataSource.setName("Users");
        mockDataSource.setOrganizationId(orgId);
        mockDataSource.setPackageName("postgres-plugin");
        mockDataSource.setPluginId(pluginMono.getId());

        StepVerifier
                .create(mockDataService.createMockDataSet(mockDataSource))
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(pluginMono.getId());
                    assertThat(createdDatasource.getName()).isEqualTo("Users");
                    Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
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

        Plugin pluginMono = pluginService.findByName("Installed Plugin Name").block();
        MockDataSource mockDataSource = new MockDataSource();
        mockDataSource.setName("Movies");
        mockDataSource.setOrganizationId(orgId);
        mockDataSource.setPackageName("mongo-plugin");
        mockDataSource.setPluginId(pluginMono.getId());

        Mono<Datasource> datasourceMono = mockDataService.createMockDataSet(mockDataSource)
                .flatMap(datasource -> mockDataService.createMockDataSet(mockDataSource));

        StepVerifier
                .create(datasourceMono)
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(pluginMono.getId());
                    assertThat(createdDatasource.getName()).isEqualTo("Movies (1)");
                    Policy manageDatasourcePolicy = Policy.builder().permission(MANAGE_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy readDatasourcePolicy = Policy.builder().permission(READ_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
                            .build();
                    Policy executeDatasourcePolicy = Policy.builder().permission(EXECUTE_DATASOURCES.getValue())
                            .users(Set.of("api_user"))
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

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetDataFromMockDB() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginService.getEditorConfigLabelMap(Mockito.anyString())).thenReturn(Mono.just(new HashMap<>()));

        Plugin plugin = pluginService.findByPackageName("postgres-plugin").block();
        MockDataSource mockDataSource = new MockDataSource();
        mockDataSource.setName("Users");
        mockDataSource.setOrganizationId(orgId);
        mockDataSource.setPackageName("postgres-plugin");
        mockDataSource.setPluginId(plugin.getId());
        Datasource datasourceMono = mockDataService.createMockDataSet(mockDataSource).block();

        ActionDTO action = new ActionDTO();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("select * from users;");
        actionConfiguration.setHttpMethod(HttpMethod.GET);

        action.setActionConfiguration(actionConfiguration);
        action.setOrganizationId(orgId);
        action.setPageId(testPage.getId());
        action.setName("testActionExecuteDbQuery");
        action.setDatasource(datasourceMono);

        Mono<ActionExecutionResult> resultMono = layoutActionService.createSingleAction(action)
                .flatMap(savedAction -> {
                    ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
                    executeActionDTO.setActionId(savedAction.getId());
                    executeActionDTO.setViewMode(false);
                    return newActionService.executeAction(executeActionDTO);
                });

        StepVerifier
                .create(resultMono)
                .assertNext(result -> {
                    assertThat(result).isNotNull();
                    assertThat(result.getIsExecutionSuccess());
                })
                .verifyComplete();
    }
}
