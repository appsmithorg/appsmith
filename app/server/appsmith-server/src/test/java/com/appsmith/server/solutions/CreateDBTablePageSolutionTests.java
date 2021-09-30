package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.Key;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.external.models.DatasourceStructure.TableType;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.OrganizationService;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class CreateDBTablePageSolutionTests {

    @Autowired
    CreateDBTablePageSolution solution;

    @Autowired
    NewActionService newActionService;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PluginRepository pluginRepository;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    private CRUDPageResourceDTO resource = new CRUDPageResourceDTO();

    private Datasource testDatasource = new Datasource();

    private Organization testOrg;

    private Application testApp;

    private Plugin postgreSQLPlugin;

    private DatasourceStructure structure = new DatasourceStructure();

    // Regex to break string in separate words
    final static String specialCharactersRegex = "[^a-zA-Z0-9,;(){}*_]+";

    private final String SELECT_QUERY = "SelectQuery";

    private final String FIND_QUERY = "FindQuery";

    private final String LIST_QUERY = "ListFiles";

    DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

    private final Map<String, String> actionNameToBodyMap = Map.of(
        "DeleteQuery", "DELETE FROM sampleTable\n" +
            "  WHERE \"primaryKey\" = {{Table1.triggeredRow.primaryKey}};",

        "InsertQuery", "INSERT INTO sampleTable (\n" +
            "\t\"field1.something\", \n" +
            "\t\"field2\",\n" +
            "\t\"field3\", \n" +
            "\t\"field4\"\n" +
            ")\n" +
            "VALUES (\n" +
            "\t\t\t\t{{insert_col_input2.text}}, \n" +
            "\t\t\t\t{{insert_col_input3.text}}, \n" +
            "\t\t\t\t{{insert_col_input4.text}}, \n" +
            "\t\t\t\t{{insert_col_input5.text}}\n" +
            ");",

        "SelectQuery", "SELECT * FROM sampleTable\n" +
            "WHERE \"field1.something\" like '%{{Table1.searchText || \"\"}}%'\n" +
            "ORDER BY \"{{col_select.selectedOptionValue}}\" {{order_select.selectedOptionValue}}\n" +
            "LIMIT {{Table1.pageSize}}" +
            "OFFSET {{(Table1.pageNo - 1) * Table1.pageSize}};",

        "UpdateQuery", "UPDATE sampleTable SET\n" +
            "\t\t\"field1.something\" = '{{update_col_2.text}}',\n" +
            "    \"field2\" = '{{update_col_3.text}}',\n" +
            "    \"field3\" = '{{update_col_4.text}}',\n" +
            "\t\t\"field4\" = '{{update_col_5.text}}'\n" +
            "  WHERE \"primaryKey\" = {{Table1.selectedRow.primaryKey}};"
    );

    private final String dropdownOptions = "options -> [\n" +
        "{\n\t\"label\": \"field3\",\n\t\"value\": \"field3\"\n}, \n{\n\t\"label\": \"field4\",\n" +
        "\t\"value\": \"field4\"\n}, \n{\n\t\"label\": \"field1_something\",\n\t\"value\": \"field1.something\"\n" +
        "}, \n{\n\t\"label\": \"field2\",\n\t\"value\": \"field2\"\n}, \n{\n\t\"label\": \"primaryKey\",\n" +
        "\t\"value\": \"primaryKey\"\n}]";

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        postgreSQLPlugin = pluginRepository.findByName("PostgreSQL").block();

        Organization organization = new Organization();
        organization.setName("Create-DB-Table-Page-Org");
        testOrg = organizationService.create(organization).block();

        Application testApplication = new Application();
        testApplication.setName("DB-Table-Page-Test-Application");
        testApplication.setOrganizationId(testOrg.getId());
        testApp = applicationPageService.createApplication(testApplication, testOrg.getId()).block();

        List<Key> keys = List.of(new DatasourceStructure.PrimaryKey("pKey", List.of("primaryKey")));
        List<Column> columns = List.of(
            new Column("primaryKey", "type1", null, true),
            new Column("field1.something", "VARCHAR(23)", null, false),
            new Column("field2", "type3", null, false),
            new Column("field3", "type4", null, false),
            new Column("field4", "type5", null, false)
        );
        List<Table> tables = List.of(new Table(TableType.TABLE, "", "sampleTable", columns, keys, new ArrayList<>()));
        structure.setTables(tables);
        testDatasource.setPluginId(postgreSQLPlugin.getId());
        testDatasource.setOrganizationId(testOrg.getId());
        testDatasource.setName("CRUD-Page-Table-DS");
        testDatasource.setStructure(structure);
        datasourceConfiguration.setUrl("http://test.com");
        testDatasource.setDatasourceConfiguration(datasourceConfiguration);
        datasourceService.create(testDatasource).block();

        resource.setTableName(testDatasource.getStructure().getTables().get(0).getName());
        resource.setDatasourceId(testDatasource.getId());

    }

    Mono<List<NewAction>> getActions(String pageId) {
        return newActionService.findByPageId(pageId).collectList();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithInvalidApplicationIdTest() {
        
        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(testApp.getPages().get(0).getId(), resource);

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATION_ID)))
            .verify();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithInvalidDatasourceTest() {

        Datasource invalidDatasource = new Datasource();
        invalidDatasource.setOrganizationId(testOrg.getId());
        invalidDatasource.setName("invalid_datasource");
        invalidDatasource.setDatasourceConfiguration(new DatasourceConfiguration());

        resource.setDatasourceId(invalidDatasource.getId());
        Mono<CRUDPageResponseDTO> resultMono = datasourceService.create(invalidDatasource)
            .flatMap(datasource -> {
                resource.setApplicationId(testApp.getId());
                resource.setDatasourceId(datasource.getId());
                return solution.createPageFromDBTable(testApp.getPages().get(0).getId(), resource);
            });

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.INVALID_DATASOURCE.getMessage(FieldName.DATASOURCE, invalidDatasource.getId())))
            .verify();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithInvalidRequestBodyTest() {
        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(testApp.getPages().get(0).getId(), new CRUDPageResourceDTO());

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(", tableName and datasourceId must be present")))
            .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageId() {

        resource.setApplicationId(testApp.getId());
        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(null, resource);

        StepVerifier
            .create(resultMono)
            .assertNext(crudPage -> {
                PageDTO page = crudPage.getPage();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo("SampleTable");
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                assertThat(layout.getId()).isNotNull();
                assertThat(layout.getWidgetNames()).isNotEmpty();
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();
                assertThat(layout.getDsl().get("children").toString().replaceAll(specialCharactersRegex, ""))
                    .containsIgnoringCase(dropdownOptions.replaceAll(specialCharactersRegex, ""));
                assertThat(crudPage.getSuccessMessage()).isNotNull();
                assertThat(crudPage.getSuccessImageUrl()).isNotNull();
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithValidPageIdForPostgresqlDS() {

        resource.setApplicationId(testApp.getId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page");

        Mono<PageDTO> resultMono = applicationPageService.createPage(newPage)
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource))
            .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier
            .create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
            .assertNext(tuple -> {
                PageDTO page = tuple.getT1();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo(newPage.getName());
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                layout.getLayoutOnLoadActions().get(0).forEach(actionDTO -> {
                    assertThat(actionDTO.getName()).isEqualTo(SELECT_QUERY);
                });
                assertThat(layout.getId()).isNotNull();
                assertThat(layout.getWidgetNames()).isNotEmpty();
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();

                assertThat(actions).hasSize(4);
                for (NewAction action : actions) {
                    ActionConfiguration actionConfiguration = action.getUnpublishedAction().getActionConfiguration();
                    String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                    String templateActionBody =  actionNameToBodyMap
                        .get(action.getUnpublishedAction().getName()).replaceAll(specialCharactersRegex, "")
                        .replace("like", "ilike");
                    assertThat(actionBody).isEqualTo(templateActionBody);
                }
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithValidPageIdForMySqlDS() {

        resource.setApplicationId(testApp.getId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page-mysql");
        StringBuilder pluginName = new StringBuilder();

        Mono<Datasource> datasourceMono = pluginRepository.findByName("Mysql")
            .flatMap(plugin -> {
                pluginName.append(plugin.getName());
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setOrganizationId(testOrg.getId());
                datasource.setName("MySql-CRUD-Page-Table-DS");
                datasource.setStructure(structure);
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                return datasourceService.create(datasource);
            });

        Mono<CRUDPageResponseDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return applicationPageService.createPage(newPage);
            })
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource));

        StepVerifier
            .create(resultMono.zipWhen(crudPageResponseDTO -> getActions(crudPageResponseDTO.getPage().getId())))
            .assertNext(tuple -> {
                CRUDPageResponseDTO crudPageResponseDTO = tuple.getT1();
                PageDTO page = crudPageResponseDTO.getPage();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo(newPage.getName());
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                layout.getLayoutOnLoadActions().get(0).forEach(actionDTO -> {
                    assertThat(actionDTO.getName()).isEqualTo(SELECT_QUERY);
                });
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();

                assertThat(actions).hasSize(4);
                for (NewAction action : actions) {
                    ActionConfiguration actionConfiguration = action.getUnpublishedAction().getActionConfiguration();
                    String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                    String templateActionBody =  actionNameToBodyMap
                        .get(action.getUnpublishedAction().getName()).replaceAll(specialCharactersRegex, "");
                    assertThat(actionBody).isEqualTo(templateActionBody);

                    if (SELECT_QUERY.equals(action.getUnpublishedAction().getName())) {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isTrue();
                    } else {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isFalse();
                    }
                }
                assertThat(crudPageResponseDTO.getSuccessMessage()).containsIgnoringCase(pluginName);
                assertThat(crudPageResponseDTO.getSuccessMessage()).containsIgnoringCase("TABLE");
                assertThat(crudPageResponseDTO.getSuccessImageUrl()).isNotNull();
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithValidPageIdForRedshiftDS() {

        resource.setApplicationId(testApp.getId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page-redshift");

        Mono<Datasource> datasourceMono = pluginRepository.findByName("Redshift")
            .flatMap(plugin -> {
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setOrganizationId(testOrg.getId());
                datasource.setName("Redshift-CRUD-Page-Table-DS");
                datasource.setStructure(structure);
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                return datasourceService.create(datasource);
            });

        Mono<PageDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return applicationPageService.createPage(newPage);
            })
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource))
            .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier
            .create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
            .assertNext(tuple -> {
                PageDTO page = tuple.getT1();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo(newPage.getName());
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();

                assertThat(actions).hasSize(4);
                for (NewAction action : actions) {
                    ActionConfiguration actionConfiguration = action.getUnpublishedAction().getActionConfiguration();
                    String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                    String templateActionBody =  actionNameToBodyMap
                        .get(action.getUnpublishedAction().getName()).replaceAll(specialCharactersRegex, "");
                    assertThat(actionBody).isEqualTo(templateActionBody);

                    if (SELECT_QUERY.equals(action.getUnpublishedAction().getName())) {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isTrue();
                    } else {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isFalse();
                    }
                }
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageIdForMSSqlDS() {

        resource.setApplicationId(testApp.getId());

        Mono<Datasource> datasourceMono = pluginRepository.findByName("MsSQL")
            .flatMap(plugin -> {
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setOrganizationId(testOrg.getId());
                datasource.setName("MSSql-CRUD-Page-Table-DS");
                datasource.setStructure(structure);
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                return datasourceService.create(datasource);
            });

        Mono<PageDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return solution.createPageFromDBTable(null, resource);
            })
            .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier
            .create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
            .assertNext(tuple -> {
                PageDTO page = tuple.getT1();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo("SampleTable");
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();

                assertThat(actions).hasSize(4);
                for (NewAction action : actions) {
                    ActionConfiguration actionConfiguration = action.getUnpublishedAction().getActionConfiguration();
                    String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                    String templateActionBody =  actionNameToBodyMap
                        .get(action.getUnpublishedAction().getName()).replaceAll(specialCharactersRegex, "");
                    assertThat(actionBody).isEqualTo(templateActionBody);

                    if (SELECT_QUERY.equals(action.getUnpublishedAction().getName())) {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isTrue();
                    } else {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isFalse();
                    }
                }
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageIdForSnowflake() {

        resource.setApplicationId(testApp.getId());

        Mono<Datasource> datasourceMono = pluginRepository.findByName("Snowflake")
            .flatMap(plugin -> {
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setOrganizationId(testOrg.getId());
                datasource.setName("Snowflake-CRUD-Page-Table-DS");
                datasource.setStructure(structure);
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                return datasourceService.create(datasource);
            });

        Mono<PageDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return solution.createPageFromDBTable(null, resource);
            })
            .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier
            .create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
            .assertNext(tuple -> {
                PageDTO page = tuple.getT1();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo("SampleTable");
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();

                assertThat(actions).hasSize(4);
                for (NewAction action : actions) {
                    ActionConfiguration actionConfiguration = action.getUnpublishedAction().getActionConfiguration();
                    String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                    String templateActionBody =  actionNameToBodyMap
                        .get(action.getUnpublishedAction().getName()).replaceAll(specialCharactersRegex, "");
                    assertThat(actionBody).isEqualTo(templateActionBody);
                    if (SELECT_QUERY.equals(action.getUnpublishedAction().getName())) {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isTrue();
                    } else {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isFalse();
                    }
                }
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageIdForS3() {

        resource.setApplicationId(testApp.getId());
        StringBuilder pluginName = new StringBuilder();

        Mono<Datasource> datasourceMono = pluginRepository.findByName("S3")
            .flatMap(plugin -> {
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setOrganizationId(testOrg.getId());
                datasource.setName("S3-CRUD-Page-Table-DS");
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                pluginName.append(plugin.getName());
                return datasourceService.create(datasource);
            });

        Mono<CRUDPageResponseDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return solution.createPageFromDBTable(null, resource);
            });

        StepVerifier
            .create(resultMono.zipWhen(crudPageResponseDTO -> getActions(crudPageResponseDTO.getPage().getId())))
            .assertNext(tuple -> {
                CRUDPageResponseDTO crudPage = tuple.getT1();
                PageDTO page = crudPage.getPage();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo("SampleTable");
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                layout.getLayoutOnLoadActions().get(0).forEach(actionDTO -> {
                    assertThat(actionDTO.getName()).isEqualTo(LIST_QUERY);
                });

                assertThat(actions).hasSize(5);
                for (NewAction action : actions) {
                    ActionConfiguration actionConfiguration = action.getUnpublishedAction().getActionConfiguration();
                    assertThat(action.getUnpublishedAction().getDatasource().getStructure()).isNull();
                    assertThat(actionConfiguration.getPluginSpecifiedTemplates().get(1).getValue().toString())
                        .isEqualTo(resource.getTableName());
                }

                assertThat(crudPage.getSuccessMessage()).containsIgnoringCase(pluginName);
                assertThat(crudPage.getSuccessMessage()).containsIgnoringCase("LIST");
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithValidPageIdForGoogleSheet() {

        resource.setApplicationId(testApp.getId());
        resource.setColumns(Set.of("Col1", "Col2", "Col3", "Col4"));
        Map<String, String> pluginSpecificFields = new HashMap<>();
        pluginSpecificFields.put("sheetUrl", "https://this/is/sheet/url");
        pluginSpecificFields.put("tableHeaderIndex" ,"1");
        pluginSpecificFields.put("sheetName", "CRUD_Sheet");
        resource.setPluginSpecificParams(pluginSpecificFields);

        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page-GoogleSheet");

        Mono<Datasource> datasourceMono = pluginRepository.findByName("Google Sheets")
            .flatMap(plugin -> {
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setOrganizationId(testOrg.getId());
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                datasource.setName("Google-Sheet-CRUD-Page-Table-DS");
                return datasourceService.create(datasource);
            });

        Mono<PageDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return applicationPageService.createPage(newPage);
            })
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource))
            .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier
            .create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
            .assertNext(tuple -> {
                PageDTO page = tuple.getT1();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo(newPage.getName());
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getActionsUsedInDynamicBindings()).hasSize(1);

                assertThat(actions).hasSize(4);
                for (NewAction action : actions) {
                    ActionConfiguration actionConfiguration = action.getUnpublishedAction().getActionConfiguration();
                    assertThat(action.getUnpublishedAction().getDatasource().getStructure()).isNull();
                    if (SELECT_QUERY.equals(action.getUnpublishedAction().getName())) {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isTrue();
                    } else {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isFalse();
                    }

                    List<Property> pluginSpecifiedTemplate = actionConfiguration.getPluginSpecifiedTemplates();
                    pluginSpecifiedTemplate.forEach(template -> {
                        if (pluginSpecificFields.containsKey(template.getKey())) {
                            assertThat(template.getValue().toString()).isEqualTo(pluginSpecificFields.get(template.getKey()));
                        }
                    });
                }
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithValidPageIdForMongoDB() {

        resource.setApplicationId(testApp.getId());

        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page-Mongo");

        Mono<Datasource> datasourceMono = pluginRepository.findByName("MongoDB")
            .flatMap(plugin -> {
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setOrganizationId(testOrg.getId());
                datasource.setName("Mongo-CRUD-Page-Table-DS");
                datasource.setStructure(structure);
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                return datasourceService.create(datasource);
            });

        Mono<PageDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return applicationPageService.createPage(newPage);
            })
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource))
            .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier
            .create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
            .assertNext(tuple -> {
                PageDTO page = tuple.getT1();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo(newPage.getName());
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getActionsUsedInDynamicBindings()).hasSize(1);
                layout.getLayoutOnLoadActions().get(0).forEach(actionDTO -> {
                    assertThat(actionDTO.getName()).isEqualTo(FIND_QUERY);
                });

                assertThat(actions).hasSize(4);
                for (NewAction action : actions) {
                    ActionConfiguration actionConfiguration = action.getUnpublishedAction().getActionConfiguration();
                    if (FIND_QUERY.equals(action.getUnpublishedAction().getName())) {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isTrue();
                    } else {
                        assertThat(action.getUnpublishedAction().getExecuteOnLoad()).isFalse();
                    }

                    Map<String, Object> formData = actionConfiguration.getFormData();
                    assertThat(formData.get("collection")).isEqualTo("sampleTable");
                    String queryType = formData.get("command").toString();
                    if (queryType.equals("UPDATE")) {
                        Map<String, Object> updateMany = (Map<String, Object>) formData.get("updateMany");
                        assertThat(updateMany.get("query"))
                            .isEqualTo("{ primaryKey: ObjectId('{{data_table.selectedRow.primaryKey}}') }");

                        assertThat(updateMany.get("update").toString().replaceAll(specialCharactersRegex, ""))
                            .isEqualTo("{\"field2\" : {{update_col_1.text}},\"field1.something\" : {{update_col_2.text}},\"field3\" : {{update_col_3.text}},\"field4\" : {{update_col_4.text}}\"}"
                                .replaceAll(specialCharactersRegex, ""));
                    } else if (queryType.equals("DELETE")) {
                        Map<String, Object> delete = (Map<String, Object>) formData.get("delete");
                        assertThat(delete.get("query").toString().replaceAll(specialCharactersRegex, ""))
                            .contains("{ primaryKey: ObjectId('{{data_table.triggeredRow.primaryKey}}') }"
                                .replaceAll(specialCharactersRegex, ""));
                    } else if (queryType.equals("FIND")) {

                        Map<String, Object> find = (Map<String, Object>) formData.get("find");
                        assertThat(find.get("sort").toString().replaceAll(specialCharactersRegex, ""))
                            .isEqualTo("{ \n\"{{key_select.selectedOptionValue}}: {{order_select.selectedOptionValue}} \n}"
                                .replaceAll(specialCharactersRegex, ""));

                        assertThat(find.get("limit").toString()).isEqualTo("{{data_table.pageSize}}");

                        assertThat(find.get("skip").toString().replaceAll(specialCharactersRegex, ""))
                            .isEqualTo("{{(data_table.pageNo - 1) * data_table.pageSize}}".replaceAll(specialCharactersRegex, ""));

                        assertThat(find.get("query").toString().replaceAll(specialCharactersRegex, ""))
                            .isEqualTo("{ field1.something: /{{data_table.searchText||\"\"}}/i }".replaceAll(specialCharactersRegex, ""));
                    }
                }
            })
            .verifyComplete();
    }

}
