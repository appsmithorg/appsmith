package com.appsmith.server.services;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.MockDataSource;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class MockDataServiceTest {

    @Autowired
    PluginService pluginService;

    @Autowired
    OrganizationRepository organizationRepository;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    MockDataService mockDataService;

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
    public void testGetMockDataSets() {
        StepVerifier
                .create(mockDataService.getMockDataSet())
                .assertNext( mockDataSets -> {
                    assertThat(mockDataSets.getMockdbs().size()).isEqualTo(2);
                    assertThat(mockDataSets.getMockdbs().stream().anyMatch(data -> {
                        return data.getName().equals("movies") &&
                                data.getPluginName().equals("MongoDB") &&
                                data.getPackageName().equals("mongo-plugin");
                    }));
                    assertThat(mockDataSets.getMockdbs().stream().anyMatch(data -> {
                        return data.getName().equals("users") &&
                                data.getPluginName().equals("PostgreSQL") &&
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
        mockDataSource.setName("movies");
        mockDataSource.setOrganizationId(orgId);
        mockDataSource.setPluginName("MongoDB");
        mockDataSource.setPluginId(pluginMono.getId());

        StepVerifier
                .create(mockDataService.createMockDataSet(mockDataSource))
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(pluginMono.getId());
                    assertThat(createdDatasource.getName()).isEqualTo("MOVIES - Mock");
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
        mockDataSource.setName("users");
        mockDataSource.setOrganizationId(orgId);
        mockDataSource.setPluginName("PostgreSQL");
        mockDataSource.setPluginId(pluginMono.getId());

        StepVerifier
                .create(mockDataService.createMockDataSet(mockDataSource))
                .assertNext(createdDatasource -> {
                    assertThat(createdDatasource.getId()).isNotEmpty();
                    assertThat(createdDatasource.getPluginId()).isEqualTo(pluginMono.getId());
                    assertThat(createdDatasource.getName()).isEqualTo("USERS - Mock");
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
}
