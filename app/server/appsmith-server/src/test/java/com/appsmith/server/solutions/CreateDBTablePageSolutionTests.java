package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.Key;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.external.models.DatasourceStructure.TableType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
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
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_PAGES;
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
    NewPageService newPageService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    @Autowired
    ApplicationService applicationService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    private CRUDPageResourceDTO resource = new CRUDPageResourceDTO();

    private static Datasource testDatasource = new Datasource();

    private static Workspace testWorkspace;

    private static Application testApp;

    private static Plugin postgreSQLPlugin;

    private static DatasourceStructure structure = new DatasourceStructure();

    // Regex to break string in separate words
    final static String specialCharactersRegex = "[^a-zA-Z0-9,;(){}*_]+";

    private final String SELECT_QUERY = "SelectQuery";

    private final String FIND_QUERY = "FindQuery";

    private final String LIST_QUERY = "ListFiles";

    private final String UPDATE_QUERY = "UpdateQuery";

    private final String INSERT_QUERY = "InsertQuery";

    private final static String DATA = "data";

    DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

    private final Map<String, String> actionNameToBodyMap = Map.of(
        "DeleteQuery", "DELETE FROM sampleTable\n" +
            "  WHERE \"id\" = {{data_table.triggeredRow.id}};",

        "InsertQuery", "INSERT INTO sampleTable (\n" +
            "\t\"field1.something\", \n" +
            "\t\"field2\",\n" +
            "\t\"field3\", \n" +
            "\t\"field4\"\n" +
            ")\n" +
            "VALUES (\n" +
            "\t\t\t\t{{insert_form.formData.field1.something}}, \n" +
            "\t\t\t\t{{insert_form.formData.field2}}, \n" +
            "\t\t\t\t{{insert_form.formData.field3}}, \n" +
            "\t\t\t\t{{insert_form.formData.field4}}\n" +
            ");",

        "SelectQuery", "SELECT * FROM sampleTable\n" +
            "WHERE \"field1.something\" like '%{{data_table.searchText || \"\"}}%'\n" +
            "ORDER BY \"{{data_table.sortOrder.column || 'id'}}\" {{data_table.sortOrder.order || 'ASC'}}\n" +
            "LIMIT {{data_table.pageSize}}" +
            "OFFSET {{(data_table.pageNo - 1) * data_table.pageSize}};",

        "UpdateQuery", "UPDATE sampleTable SET\n" +
            "\t\t\"field1.something\" = '{{update_form.fieldState.field1.something.isVisible ? update_form.formData.field1.something : update_form.sourceData.field1.something}}',\n" +
            "    \"field2\" = '{{update_form.fieldState.field2.isVisible ? update_form.formData.field2 : update_form.sourceData.field2}}',\n" +
            "    \"field3\" = '{{update_form.fieldState.field3.isVisible ? update_form.formData.field3 : update_form.sourceData.field3}}',\n" +
            "\t\t\"field4\" = '{{update_form.fieldState.field4.isVisible ? update_form.formData.field4 : update_form.sourceData.field4}}'\n" +
            "  WHERE \"id\" = {{data_table.selectedRow.id}};",

        "UpdateActionWithLessColumns", "UPDATE limitedColumnTable SET\n" +
                "\t\t\"field1.something\" = '{{update_form.fieldState.field1.something.isVisible ? update_form.formData.field1.something : update_form.sourceData.field1.something}}'\n" +
                "  WHERE \"id\" = {{data_table.selectedRow.id}};",

        "InsertActionWithLessColumns", "INSERT INTO limitedColumnTable (\n" +
                    "\t\"field1.something\" \n" +
                    ")\n" +
                    "VALUES (\n" +
                    "\t\t\t\t{{insert_form.formData.field1.something}} \n" +
                    ");"
    );

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        Mockito.when(pluginExecutorHelper.getPluginExecutorFromPackageName(Mockito.anyString())).thenReturn(Mono.just(new MockPluginExecutor()));

        if (testWorkspace == null) {
            Workspace workspace = new Workspace();
            workspace.setName("Create-DB-Table-Page-Org");
            testWorkspace = workspaceService.create(workspace).block();
        }

        if (testApp == null) {
            Application testApplication = new Application();
            testApplication.setName("DB-Table-Page-Test-Application");
            testApplication.setWorkspaceId(testWorkspace.getId());
            testApp = applicationPageService.createApplication(testApplication, testWorkspace.getId()).block();
        }

        if (StringUtils.isEmpty(testDatasource.getId())) {
            postgreSQLPlugin = pluginRepository.findByName("PostgreSQL").block();
        // This datasource structure includes only 1 table with 2 columns. This is to test the scenario where template table
        // have more number of columns than the user provided table which leads to deleting the column names from action configuration

        List<Column> limitedColumns = List.of(
                new Column("id", "type1", null, true),
                new Column("field1.something", "VARCHAR(23)", null, false)
        );
        List<Key> keys = List.of(new DatasourceStructure.PrimaryKey("pKey", List.of("id")));
        List<Column> columns = List.of(
            new Column("id", "type1", null, true),
            new Column("field1.something", "VARCHAR(23)", null, false),
            new Column("field2", "type3", null, false),
            new Column("field3", "type4", null, false),
            new Column("field4", "type5", null, false)
        );
        List<Table> tables = List.of(
                new Table(TableType.TABLE, "", "sampleTable", columns, keys, new ArrayList<>()),
                new Table(TableType.TABLE, "", "limitedColumnTable", limitedColumns, keys, new ArrayList<>())
        );
            structure.setTables(tables);
            testDatasource.setPluginId(postgreSQLPlugin.getId());
            testDatasource.setWorkspaceId(testWorkspace.getId());
            testDatasource.setName("CRUD-Page-Table-DS");
            testDatasource.setStructure(structure);
            datasourceConfiguration.setUrl("http://test.com");
            testDatasource.setDatasourceConfiguration(datasourceConfiguration);
            datasourceService.create(testDatasource).block();
        }
        resource.setTableName(testDatasource.getStructure().getTables().get(0).getName());
        resource.setDatasourceId(testDatasource.getId());
    }

    Mono<List<NewAction>> getActions(String pageId) {
        return newActionService.findByPageId(pageId).collectList();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithInvalidApplicationIdTest() {

        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(testApp.getPages().get(0).getId(), resource, "");

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
        invalidDatasource.setWorkspaceId(testWorkspace.getId());
        invalidDatasource.setName("invalid_datasource");
        invalidDatasource.setDatasourceConfiguration(new DatasourceConfiguration());

        resource.setDatasourceId(invalidDatasource.getId());
        Mono<CRUDPageResponseDTO> resultMono = datasourceService.create(invalidDatasource)
            .flatMap(datasource -> {
                resource.setApplicationId(testApp.getId());
                resource.setDatasourceId(datasource.getId());
                return solution.createPageFromDBTable(testApp.getPages().get(0).getId(), resource, null);
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
        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(testApp.getPages().get(0).getId(), new CRUDPageResourceDTO(), "");

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage("tableName and datasourceId")))
            .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPage_withInvalidBranchName_throwException() {
        final String pageId = testApp.getPages().get(0).getId();
        resource.setApplicationId(testApp.getId());
        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(pageId, resource, "invalidBranch");

        StepVerifier
                .create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.PAGE, pageId + ", " + "invalidBranch")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageId() {

        resource.setApplicationId(testApp.getId());
        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(null, resource, null);

        StepVerifier
            .create(resultMono)
            .assertNext(crudPage -> {
                PageDTO page = crudPage.getPage();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).contains("SampleTable");
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                assertThat(layout.getId()).isNotNull();
                assertThat(layout.getWidgetNames()).isNotEmpty();
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();
                assertThat(crudPage.getSuccessMessage()).isNotNull();
                assertThat(crudPage.getSuccessImageUrl()).isNotNull();
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPage_withValidBranch_validDefaultIds() {

        Application gitConnectedApp = new Application();
        gitConnectedApp.setName(UUID.randomUUID().toString());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("crudTestBranch");
        gitConnectedApp.setGitApplicationMetadata(gitData);
        applicationPageService.createApplication(gitConnectedApp, testWorkspace.getId())
                .flatMap(application -> {
                    application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    gitData.setDefaultApplicationId(application.getId());
                    return applicationService.save(application)
                            .zipWhen(application1 -> importExportApplicationService.exportApplicationById(application1.getId(), gitData.getBranchName()));
                })
                // Assign the branchName to all the resources connected to the application
                .flatMap(tuple -> importExportApplicationService.importApplicationInWorkspace(testWorkspace.getId(), tuple.getT2(), tuple.getT1().getId(), gitData.getBranchName()))
                .block();

        resource.setApplicationId(gitData.getDefaultApplicationId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(gitData.getDefaultApplicationId());
        newPage.setName("crud-admin-page-with-git-connected-app");

        Mono<NewPage> resultMono = applicationPageService.createPageWithBranchName(newPage, gitData.getBranchName())
                .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource, gitData.getBranchName()))
                .flatMap(crudPageResponseDTO ->
                        newPageService.findByBranchNameAndDefaultPageId(gitData.getBranchName(), crudPageResponseDTO.getPage().getId(), READ_PAGES));

        StepVerifier
                .create(resultMono.zipWhen(newPage1 -> getActions(newPage1.getId())))
                .assertNext(tuple -> {
                    NewPage newPage1 = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2();

                    PageDTO page = newPage1.getUnpublishedPage();
                    Layout layout = page.getLayouts().get(0);
                    assertThat(page.getName()).isEqualTo("crud-admin-page-with-git-connected-app");

                    assertThat(newPage1.getDefaultResources()).isNotNull();
                    assertThat(newPage1.getDefaultResources().getBranchName()).isEqualTo(gitData.getBranchName());
                    assertThat(newPage1.getDefaultResources().getPageId()).isEqualTo(newPage1.getId());
                    assertThat(newPage1.getDefaultResources().getApplicationId()).isEqualTo(newPage1.getApplicationId());

                    assertThat(actionList).hasSize(4);
                    DefaultResources newActionResources = actionList.get(0).getDefaultResources();
                    DefaultResources actionDTOResources = actionList.get(0).getUnpublishedAction().getDefaultResources();
                    assertThat(newActionResources.getActionId()).isEqualTo(actionList.get(0).getId());
                    assertThat(newActionResources.getApplicationId()).isEqualTo(newPage1.getDefaultResources().getApplicationId());
                    assertThat(newActionResources.getPageId()).isNull();
                    assertThat(newActionResources.getBranchName()).isEqualTo(gitData.getBranchName());
                    assertThat(actionDTOResources.getPageId()).isEqualTo(newPage1.getDefaultResources().getPageId());
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
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource, ""))
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
                    ActionDTO unpublishedAction = action.getUnpublishedAction();
                    ActionConfiguration actionConfiguration = unpublishedAction.getActionConfiguration();
                    String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                    String templateActionBody =  actionNameToBodyMap
                        .get(action.getUnpublishedAction().getName()).replaceAll(specialCharactersRegex, "")
                        .replace("like", "ilike");
                    assertThat(actionBody).isEqualTo(templateActionBody);
                    if (!StringUtils.equals(unpublishedAction.getName(), SELECT_QUERY)) {
                        assertThat(actionConfiguration.getPluginSpecifiedTemplates().get(0).getValue()).isEqualTo(Boolean.TRUE);
                    }
                }
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithLessColumnsComparedToTemplateForPostgres() {

        CRUDPageResourceDTO resourceDTO = new CRUDPageResourceDTO();
        resourceDTO.setTableName(testDatasource.getStructure().getTables().get(1).getName());
        resourceDTO.setDatasourceId(testDatasource.getId());
        resourceDTO.setApplicationId(testApp.getId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page-postgres-with-less-columns");

        Mono<CRUDPageResponseDTO> resultMono = applicationPageService.createPage(newPage)
                .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resourceDTO, ""));

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
                        String actionName;
                        if (StringUtils.equals(action.getUnpublishedAction().getName(), UPDATE_QUERY)) {
                            actionName = "UpdateActionWithLessColumns";
                        } else if (StringUtils.equals(action.getUnpublishedAction().getName(), INSERT_QUERY)) {
                            actionName = "InsertActionWithLessColumns";
                        } else {
                            actionName = action.getUnpublishedAction().getName();
                        }

                        String templateActionBody =  actionNameToBodyMap
                                .get(actionName)
                                .replaceAll(specialCharactersRegex, "")
                                .replace("like", "ilike")
                                .replace(structure.getTables().get(0).getName(), structure.getTables().get(1).getName());;
                        assertThat(actionBody).isEqualTo(templateActionBody);
                    }
                    assertThat(crudPageResponseDTO.getSuccessMessage()).containsIgnoringCase("TABLE");
                    assertThat(crudPageResponseDTO.getSuccessImageUrl()).isNotNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithLessColumnsComparedToTemplateForSql() {

        CRUDPageResourceDTO resourceDTO = new CRUDPageResourceDTO();
        resourceDTO.setTableName(testDatasource.getStructure().getTables().get(1).getName());
        resourceDTO.setDatasourceId(testDatasource.getId());
        resourceDTO.setApplicationId(testApp.getId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page-mysql");
        StringBuilder pluginName = new StringBuilder();

        Mono<Datasource> datasourceMono = pluginRepository.findByName("MySQL")
                .flatMap(plugin -> {
                    pluginName.append(plugin.getName());
                    Datasource datasource = new Datasource();
                    datasource.setPluginId(plugin.getId());
                    datasource.setWorkspaceId(testWorkspace.getId());
                    datasource.setName("MySql-CRUD-Page-Table-With-Less-Columns-DS");
                    datasource.setStructure(structure);
                    datasource.setDatasourceConfiguration(datasourceConfiguration);
                    return datasourceService.create(datasource);
                });

        Mono<CRUDPageResponseDTO> resultMono = datasourceMono
                .flatMap(datasource1 -> {
                    resourceDTO.setDatasourceId(datasource1.getId());
                    return applicationPageService.createPage(newPage);
                })
                .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resourceDTO, null));

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
                        String actionName;
                        if (StringUtils.equals(action.getUnpublishedAction().getName(), UPDATE_QUERY)) {
                            actionName = "UpdateActionWithLessColumns";
                        } else if (StringUtils.equals(action.getUnpublishedAction().getName(), INSERT_QUERY)) {
                            actionName = "InsertActionWithLessColumns";
                        } else {
                            actionName = action.getUnpublishedAction().getName();
                        }

                        String templateActionBody =  actionNameToBodyMap
                                .get(actionName)
                                .replaceAll(specialCharactersRegex, "")
                                .replace(structure.getTables().get(0).getName(), structure.getTables().get(1).getName());;
                        assertThat(actionBody).isEqualTo(templateActionBody);
                    }
                    assertThat(crudPageResponseDTO.getSuccessMessage()).containsIgnoringCase(pluginName);
                    assertThat(crudPageResponseDTO.getSuccessMessage()).containsIgnoringCase("TABLE");
                    assertThat(crudPageResponseDTO.getSuccessImageUrl()).isNotNull();
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

        Mono<Datasource> datasourceMono = pluginRepository.findByName("MySQL")
            .flatMap(plugin -> {
                pluginName.append(plugin.getName());
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setWorkspaceId(testWorkspace.getId());
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
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource, null));

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
                datasource.setWorkspaceId(testWorkspace.getId());
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
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource, ""))
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


    // TODO this has been disabled as we don't have the getStructure method for mssql-plugin
    /*
    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageIdForMSSqlDS() {

        resource.setApplicationId(testApp.getId());

        Mono<Datasource> datasourceMono = pluginRepository.findByPackageName("mssql-plugin")
            .flatMap(plugin -> {
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setWorkspaceId(testWorkspace.getId());
                datasource.setName("MSSql-CRUD-Page-Table-DS");
                datasource.setStructure(structure);
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                return datasourceService.create(datasource);
            });

        Mono<PageDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return solution.createPageFromDBTable(null, resource, null);
            })
            .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier
            .create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
            .assertNext(tuple -> {
                PageDTO page = tuple.getT1();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).contains("SampleTable");
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
    */

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageIdForSnowflake() {

        resource.setApplicationId(testApp.getId());

        Mono<Datasource> datasourceMono = pluginRepository.findByName("Snowflake")
            .flatMap(plugin -> {
                Datasource datasource = new Datasource();
                datasource.setPluginId(plugin.getId());
                datasource.setWorkspaceId(testWorkspace.getId());
                datasource.setName("Snowflake-CRUD-Page-Table-DS");
                datasource.setStructure(structure);
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                return datasourceService.create(datasource);
            });

        Mono<PageDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return solution.createPageFromDBTable(null, resource, "");
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
                datasource.setWorkspaceId(testWorkspace.getId());
                datasource.setName("S3-CRUD-Page-Table-DS");
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                pluginName.append(plugin.getName());
                return datasourceService.create(datasource);
            });

        Mono<CRUDPageResponseDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return solution.createPageFromDBTable(null, resource, "");
            });

        StepVerifier
            .create(resultMono.zipWhen(crudPageResponseDTO -> getActions(crudPageResponseDTO.getPage().getId())))
            .assertNext(tuple -> {
                CRUDPageResponseDTO crudPage = tuple.getT1();
                PageDTO page = crudPage.getPage();
                List<NewAction> actions = tuple.getT2();
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).contains("SampleTable");
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
                    assertThat(((Map<String, String>) actionConfiguration.getFormData().get("bucket")).get(DATA))
                        .isEqualTo(resource.getTableName());
                    if (action.getUnpublishedAction().getName().equals(LIST_QUERY)) {
                        Map<String, Object> listObject = (Map<String, Object>) actionConfiguration.getFormData().get("list");
                        assertThat(((Map<String, Object>)((Map<String, Object>) listObject.get("where")).get(DATA)).get("condition"))
                                .isEqualTo("AND");
                    }
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
                datasource.setWorkspaceId(testWorkspace.getId());
                datasource.setDatasourceConfiguration(datasourceConfiguration);
                datasource.setName("Google-Sheet-CRUD-Page-Table-DS");
                return datasourceService.create(datasource);
            });

        Mono<PageDTO> resultMono = datasourceMono
            .flatMap(datasource1 -> {
                resource.setDatasourceId(datasource1.getId());
                return applicationPageService.createPage(newPage);
            })
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource, null))
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
                datasource.setWorkspaceId(testWorkspace.getId());
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
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource, null))
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
                    assertThat(((Map<String, Object>) formData.get("collection")).get(DATA)).isEqualTo("sampleTable");
                    String queryType = ((Map<String, String>) formData.get("command")).get(DATA);
                    if (queryType.equals("UPDATE")) {
                        Map<String, Object> updateMany = (Map<String, Object>) formData.get("updateMany");
                        assertThat(((Map<String, String>)updateMany.get("query")).get(DATA).replaceAll(specialCharactersRegex, ""))
                            .isEqualTo("{ id: ObjectId('{{data_table.selectedRow.id}}') }".replaceAll(specialCharactersRegex, ""));

                        assertThat(((Map<String, Object>) updateMany.get("update")).get(DATA))
                            .isEqualTo("{\n" +
                                    "  $set:{{update_form.formData}}\n" +
                                    "}".replaceAll(specialCharactersRegex, ""));
                        assertThat(((Map<String, Object>) formData.get("smartSubstitution")).get(DATA)).isEqualTo(true);
                    } else if (queryType.equals("DELETE")) {
                        Map<String, Object> delete = (Map<String, Object>) formData.get("delete");
                        assertThat(((Map<String, String>) delete.get("query")).get(DATA).replaceAll(specialCharactersRegex, ""))
                            .isEqualTo("{ id: ObjectId('{{data_table.triggeredRow.id}}') }".replaceAll(specialCharactersRegex, ""));
                        assertThat(((Map<String, Object>) formData.get("smartSubstitution")).get(DATA)).isEqualTo(true);
                    } else if (queryType.equals("FIND")) {

                        Map<String, Object> find = (Map<String, Object>) formData.get("find");
                        assertThat(((Map<String, Object>) find.get("sort")).get(DATA).toString().replaceAll(specialCharactersRegex, ""))
                            .isEqualTo("{ \n{{data_table.sortOrder.column || 'field2'}}: {{data_table.sortOrder.order == \"desc\" ? -1 : 1}}}"
                                .replaceAll(specialCharactersRegex, ""));

                        assertThat(((Map<String, Object>) find.get("limit")).get(DATA).toString()).isEqualTo("{{data_table.pageSize}}");

                        assertThat(((Map<String, Object>) find.get("skip")).get(DATA).toString())
                            .isEqualTo("{{(data_table.pageNo - 1) * data_table.pageSize}}");

                        assertThat(((Map<String, Object>) find.get("query")).get(DATA).toString().replaceAll(specialCharactersRegex, ""))
                            .isEqualTo("{ field1.something: /{{data_table.searchText||\"\"}}/i }".replaceAll(specialCharactersRegex, ""));

                        assertThat(((Map<String, Object>) formData.get("smartSubstitution")).get(DATA)).isEqualTo(false);
                    } else if (queryType.equals("INSERT")) {
                        Map<String, Object> insert = (Map<String, Object>) formData.get("insert");

                        assertThat(((Map<String, Object>) insert.get("documents")).get(DATA)).isEqualTo("{{insert_form.formData}}");
                        assertThat(((Map<String, Object>) formData.get("smartSubstitution")).get(DATA)).isEqualTo(true);
                    }
                }
            })
            .verifyComplete();
    }

}
