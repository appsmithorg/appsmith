package com.appsmith.server.solutions.ee.datasources.environments;

import com.appsmith.external.models.ClientDataDisplayType;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import com.appsmith.server.solutions.DatasourceTriggerSolution;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;

import static com.appsmith.external.models.DatasourceStructure.TableType.TABLE;
import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(SpringExtension.class)
@SpringBootTest
public class DatasourceTriggerOOSPluginsTest {

    @MockBean
    DatasourceStructureSolution datasourceStructureSolution;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor pluginExecutor;

    @Autowired
    DatasourceTriggerSolution datasourceTriggerSolution;

    @Autowired
    UserService userService;

    @Autowired
    PluginService pluginService;

    @SpyBean
    DatasourceService datasourceService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    DatasourcePermission datasourcePermission;

    @MockBean
    FeatureFlagService featureFlagService;

    @Autowired
    EnvironmentService environmentService;

    String workspaceId;
    String defaultEnvironmentId;
    String stagingEnvironmentId;

    String datasourceId;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.doReturn(Mono.just(Boolean.TRUE)).when(featureFlagService).check(Mockito.any());
        Workspace workspace = new Workspace();
        workspace.setName("Datasource Trigger Test Workspace");
        Workspace savedWorkspace = workspaceService.create(workspace).block();
        workspaceId = savedWorkspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, AclPermission.EXECUTE_ENVIRONMENTS)
                .block();

        stagingEnvironmentId = environmentService
                .findByWorkspaceId(workspaceId)
                .filter(environment -> !Boolean.TRUE.equals(environment.getIsDefault()))
                .blockFirst()
                .getId();

        Datasource datasource = createDatasourceObject("sampleDS", workspaceId, "google-sheets-plugin");
        datasource.getDatasourceStorages().put(defaultEnvironmentId, generateSampleDatasourceStorageDTO());
        Datasource createdDatasource = datasourceService.create(datasource).block();
        datasourceId = createdDatasource.getId();
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

    private DatasourceStorageDTO generateSampleDatasourceStorageDTO() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("https://sample.endpoint", 5432L);
        DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("password");
        dbAuth.setUsername("username");
        dbAuth.setDatabaseName("databaseName");

        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setAuthentication(dbAuth);

        DatasourceStorageDTO datasourceStorageDTO = new DatasourceStorageDTO();
        datasourceStorageDTO.setEnvironmentId(defaultEnvironmentId);
        datasourceStorageDTO.setDatasourceConfiguration(datasourceConfiguration);
        return datasourceStorageDTO;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void datasourceTriggerTest() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        DatasourceStructure.Column[] table1Columns = {
            new DatasourceStructure.Column("_id1", "ObjectId", null, true),
            new DatasourceStructure.Column("age1", "Integer", null, false),
            new DatasourceStructure.Column("dob1", "Date", null, false),
            new DatasourceStructure.Column("gender1", "String", null, false),
            new DatasourceStructure.Column("luckyNumber1", "Long", null, false),
            new DatasourceStructure.Column("name1", "String", null, false),
            new DatasourceStructure.Column("netWorth1", "BigDecimal", null, false),
            new DatasourceStructure.Column("updatedByCommand1", "Object", null, false),
        };

        DatasourceStructure.Table table1 =
                new DatasourceStructure.Table(TABLE, null, "Table1", List.of(table1Columns), null, null);

        DatasourceStructure.Column[] table2Columns = {
            new DatasourceStructure.Column("_id2", "ObjectId", null, true),
            new DatasourceStructure.Column("age2", "Integer", null, false),
            new DatasourceStructure.Column("dob2", "Date", null, false),
            new DatasourceStructure.Column("gender2", "String", null, false),
            new DatasourceStructure.Column("luckyNumber2", "Long", null, false),
            new DatasourceStructure.Column("name2", "String", null, false),
            new DatasourceStructure.Column("netWorth2", "BigDecimal", null, false),
            new DatasourceStructure.Column("updatedByCommand2", "Object", null, false),
        };

        DatasourceStructure.Table table2 =
                new DatasourceStructure.Table(TABLE, null, "Table2", List.of(table2Columns), null, null);

        DatasourceStructure testStructure = new DatasourceStructure(List.of(table1, table2));

        Mockito.when(datasourceStructureSolution.getStructure(
                        Mockito.anyString(), Mockito.anyBoolean(), Mockito.matches(defaultEnvironmentId)))
                .thenReturn(Mono.just(testStructure));

        Datasource datasource = datasourceService
                .findById(datasourceId, datasourcePermission.getReadPermission())
                .block();

        Mono<TriggerResultDTO> tableNameMono = datasourceTriggerSolution.trigger(
                datasourceId,
                stagingEnvironmentId,
                new TriggerRequestDTO("ENTITY_SELECTOR", Map.of(), ClientDataDisplayType.DROP_DOWN));

        Mono<TriggerResultDTO> columnNamesMono = datasourceTriggerSolution.trigger(
                datasourceId,
                stagingEnvironmentId,
                new TriggerRequestDTO(
                        "ENTITY_SELECTOR", Map.of("tableName", "Table1"), ClientDataDisplayType.DROP_DOWN));

        StepVerifier.create(tableNameMono)
                .assertNext(tablesResult -> {
                    List tables = (List) tablesResult.getTrigger();

                    assertEquals(2, tables.size());
                })
                .verifyComplete();

        StepVerifier.create(columnNamesMono)
                .assertNext(columnsResult -> {
                    List columns = (List) columnsResult.getTrigger();

                    assertEquals(8, columns.size());
                })
                .verifyComplete();
    }
}
