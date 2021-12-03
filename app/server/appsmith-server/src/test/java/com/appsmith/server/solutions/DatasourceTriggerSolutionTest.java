package com.appsmith.server.solutions;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.UserService;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static com.appsmith.external.models.DatasourceStructure.TableType.TABLE;
import static org.junit.Assert.assertEquals;

@RunWith(SpringRunner.class)
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

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    OrganizationService organizationService;

    String orgId;

    String datasourceId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Organization organization = new Organization();
        organization.setName("Datasource Trigger Test Organization");
        Organization savedOrganization = organizationService.create(organization).block();
        orgId = savedOrganization.getId();

        Datasource datasource = new Datasource();
        datasource.setName("Datasource Trigger Database");
        datasource.setOrganizationId(orgId);
        Plugin installed_plugin = pluginService.findByName("Installed Plugin Name").block();
        datasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        datasource = datasourceService.create(datasource).block();

        datasourceId = datasource.getId();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void datasourceTriggerTest() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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

        DatasourceStructure.Table table1 = new DatasourceStructure.Table(TABLE, null, "Table1", List.of(table1Columns), null, null);

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

        DatasourceStructure.Table table2 = new DatasourceStructure.Table(TABLE, null, "Table2", List.of(table2Columns), null, null);

        DatasourceStructure testStructure = new DatasourceStructure(List.of(table1, table2));

        Mockito
                .when(datasourceStructureSolution
                        .getStructure(
                                (Datasource) Mockito.any(),
                                Mockito.anyBoolean()))
                .thenReturn(Mono.just(testStructure));


        MultiValueMap<String, Object> requestConfig = new LinkedMultiValueMap<>();
        requestConfig.add("requestType", "ENTITY_SELECTOR");
        requestConfig.add("displayType", "DROPDOWN");
        requestConfig.add("parameters", "");

        Mono<TriggerResultDTO> tableNameMono = datasourceTriggerSolution.trigger(datasourceId, requestConfig);

        requestConfig.set("parameters", "Table1");
        Mono<TriggerResultDTO> columnNamesMono = datasourceTriggerSolution.trigger(datasourceId, requestConfig);

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
