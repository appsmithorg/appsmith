package com.appsmith.server.solutions;

import com.appsmith.external.models.ClientDataDisplayType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.models.DatasourceStructure.TableType.TABLE;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class DatasourceTriggerSolutionTest {

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
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    String workspaceId;
    String defaultEnvironmentId;

    String datasourceId;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.doReturn(Mono.just(Boolean.TRUE)).when(featureFlagService).check(Mockito.any());
        Workspace workspace = new Workspace();
        workspace.setName("Datasource Trigger Test Workspace");
        Workspace savedWorkspace = workspaceService.create(workspace).block();
        workspaceId = savedWorkspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Datasource datasource = new Datasource();
        datasource.setName("Datasource Trigger Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginService.findByName("Installed Plugin Name").block();
        datasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);
        datasource = datasourceService.create(datasource).block();

        datasourceId = datasource.getId();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
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

        Mockito.when(datasourceStructureSolution.getStructure(Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Mono.just(testStructure));

        datasourceService
                .findById(datasourceId, datasourcePermission.getReadPermission())
                .block();

        Mono<TriggerResultDTO> tableNameMono = datasourceTriggerSolution.trigger(
                datasourceId,
                defaultEnvironmentId,
                new TriggerRequestDTO("ENTITY_SELECTOR", Map.of(), ClientDataDisplayType.DROP_DOWN));

        Mono<TriggerResultDTO> columnNamesMono = datasourceTriggerSolution.trigger(
                datasourceId,
                defaultEnvironmentId,
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

    @Test
    @WithUserDetails(value = "api_user")
    public void datasourceTriggerTest_should_return_collections_inorder() {
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
                new DatasourceStructure.Table(TABLE, null, "TableSecond", List.of(table1Columns), null, null);

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
                new DatasourceStructure.Table(TABLE, null, "TableFirst", List.of(table2Columns), null, null);

        DatasourceStructure testStructure = new DatasourceStructure(List.of(table1, table2));

        Mockito.when(datasourceStructureSolution.getStructure(Mockito.anyString(), Mockito.anyBoolean(), Mockito.any()))
                .thenReturn(Mono.just(testStructure));

        datasourceService
                .findById(datasourceId, datasourcePermission.getReadPermission())
                .block();
        Mockito.doReturn(Mono.just(Boolean.TRUE)).when(featureFlagService).check(Mockito.any());

        Mono<TriggerResultDTO> tableNameMono = datasourceTriggerSolution.trigger(
                datasourceId,
                defaultEnvironmentId,
                new TriggerRequestDTO("ENTITY_SELECTOR", Map.of(), ClientDataDisplayType.DROP_DOWN));

        StepVerifier.create(tableNameMono)
                .assertNext(tablesResult -> {
                    List<Map<String, String>> tables = (List<Map<String, String>>) tablesResult.getTrigger();

                    assertEquals(2, tables.size());
                    // Check the order of the tables
                    assertEquals("TableFirst", tables.get(0).get("label"));
                    assertEquals("TableSecond", tables.get(1).get("label"));
                })
                .verifyComplete();
    }
}
