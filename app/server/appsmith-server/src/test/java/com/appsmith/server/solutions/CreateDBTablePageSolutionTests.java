package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.Key;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.external.models.DatasourceStructure.TableType;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.DatasourceStructureService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.ArtifactType.APPLICATION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.spy;

@Slf4j
@SpringBootTest
@DirtiesContext
public class CreateDBTablePageSolutionTests {

    // Regex to break string in separate words
    static final String specialCharactersRegex = "[^a-zA-Z0-9,;(){}*_]+";
    private static final String DATA = "data";
    private static Datasource testDatasource = new Datasource();
    private static final DatasourceStorageStructure testDatasourceStructure = new DatasourceStorageStructure();
    private static Workspace testWorkspace;
    private static String testDefaultEnvironmentId;
    private static Application testApp;
    private static Plugin postgreSQLPlugin;
    private static final DatasourceStructure structure = new DatasourceStructure();
    private final String SELECT_QUERY = "SelectQuery";
    private final String FIND_QUERY = "FindQuery";
    private final String LIST_QUERY = "ListFiles";
    private final String UPDATE_QUERY = "UpdateQuery";
    private final String INSERT_QUERY = "InsertQuery";
    private final Map<String, String> actionNameToBodyMap = Map.of(
            "DeleteQuery",
            "DELETE FROM sampleTable\n" + "  WHERE \"id\" = {{data_table.triggeredRow.id}};",
            "InsertQuery",
            "INSERT INTO sampleTable (\n" + "\t\"field1.something\", \n"
                    + "\t\"field2\",\n"
                    + "\t\"field3\", \n"
                    + "\t\"field4\"\n"
                    + ")\n"
                    + "VALUES (\n"
                    + "\t\t\t\t{{insert_form.formData.field1.something}}, \n"
                    + "\t\t\t\t{{insert_form.formData.field2}}, \n"
                    + "\t\t\t\t{{insert_form.formData.field3}}, \n"
                    + "\t\t\t\t{{insert_form.formData.field4}}\n"
                    + ");",
            "SelectQuery",
            "SELECT * FROM sampleTable\n"
                    + "WHERE \"field1.something\" like '%{{data_table.searchText || \"\"}}%'\n"
                    + "ORDER BY \"{{data_table.sortOrder.column || 'id'}}\" {{data_table.sortOrder.order || 'ASC'}}\n"
                    + "LIMIT {{data_table.pageSize}}"
                    + "OFFSET {{(data_table.pageNo - 1) * data_table.pageSize}};",
            "UpdateQuery",
            "UPDATE sampleTable SET\n"
                    + "\t\t\"field1.something\" = '{{update_form.fieldState.field1.something.isVisible ? update_form.formData.field1.something : update_form.sourceData.field1.something}}',\n"
                    + "    \"field2\" = '{{update_form.fieldState.field2.isVisible ? update_form.formData.field2 : update_form.sourceData.field2}}',\n"
                    + "    \"field3\" = '{{update_form.fieldState.field3.isVisible ? update_form.formData.field3 : update_form.sourceData.field3}}',\n"
                    + "\t\t\"field4\" = '{{update_form.fieldState.field4.isVisible ? update_form.formData.field4 : update_form.sourceData.field4}}'\n"
                    + "  WHERE \"id\" = {{data_table.selectedRow.id}};",
            "UpdateActionWithLessColumns",
            "UPDATE limitedColumnTable SET\n"
                    + "\t\t\"field1.something\" = '{{update_form.fieldState.field1.something.isVisible ? update_form.formData.field1.something : update_form.sourceData.field1.something}}'\n"
                    + "  WHERE \"id\" = {{data_table.selectedRow.id}};",
            "InsertActionWithLessColumns",
            "INSERT INTO limitedColumnTable (\n" + "\t\"field1.something\" \n"
                    + ")\n"
                    + "VALUES (\n"
                    + "\t\t\t\t{{insert_form.formData.field1.something}} \n"
                    + ");");

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
    DatasourceStructureService datasourceStructureService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationPermission applicationPermission;

    DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    private PluginExecutor spyMockPluginExecutor = spy(new MockPluginExecutor());

    private final CRUDPageResourceDTO resource = new CRUDPageResourceDTO();

    @BeforeEach
    public void setup() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(any())).thenReturn(Mono.just(spyMockPluginExecutor));
        Mockito.when(pluginExecutorHelper.getPluginExecutorFromPackageName(Mockito.anyString()))
                .thenReturn(Mono.just(spyMockPluginExecutor))
                .thenReturn(Mono.just(spyMockPluginExecutor));

        Workspace workspace = new Workspace();
        workspace.setName("Create-DB-Table-Page-Org");
        testWorkspace = workspaceService.create(workspace).block();
        testDefaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(testWorkspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application testApplication = new Application();
        testApplication.setName("DB-Table-Page-Test-Application");
        testApplication.setWorkspaceId(testWorkspace.getId());
        testApp = applicationPageService
                .createApplication(testApplication, testWorkspace.getId())
                .block();

        postgreSQLPlugin = pluginRepository.findByName("PostgreSQL").block();
        // This datasource structure includes only 1 table with 2 columns. This is to test the scenario where
        // template table
        // have more number of columns than the user provided table which leads to deleting the column names from
        // action configuration

        List<Column> limitedColumns = List.of(
                new Column("id", "type1", null, true), new Column("field1.something", "VARCHAR(23)", null, false));
        List<Key> keys = List.of(new DatasourceStructure.PrimaryKey("pKey", List.of("id")));
        List<Column> columns = List.of(
                new Column("id", "type1", null, true),
                new Column("field1.something", "VARCHAR(23)", null, false),
                new Column("field2", "type3", null, false),
                new Column("field3", "type4", null, false),
                new Column("field4", "type5", null, false));
        List<Table> tables = List.of(
                new Table(TableType.TABLE, "", "sampleTable", columns, keys, new ArrayList<>()),
                new Table(TableType.TABLE, "", "limitedColumnTable", limitedColumns, keys, new ArrayList<>()));
        structure.setTables(tables);
        Datasource datasource = new Datasource();
        datasource.setPluginId(postgreSQLPlugin.getId());
        datasource.setWorkspaceId(testWorkspace.getId());
        datasource.setName("CRUD-Page-Table-DS");

        datasourceConfiguration.setUrl("http://test.com");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                testDefaultEnvironmentId,
                new DatasourceStorageDTO(datasource.getId(), testDefaultEnvironmentId, datasourceConfiguration));
        datasource.setDatasourceStorages(storages);

        testDatasource = datasourceService.create(datasource).block();

        testDatasourceStructure.setDatasourceId(testDatasource.getId());
        testDatasourceStructure.setEnvironmentId(testDefaultEnvironmentId);
        testDatasourceStructure.setStructure(structure);
        datasourceStructureService.save(testDatasourceStructure).block();
        resource.setTableName(structure.getTables().get(0).getName());
        resource.setDatasourceId(testDatasource.getId());
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationService
                .findByWorkspaceId(testWorkspace.getId(), applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace =
                workspaceService.archiveById(testWorkspace.getId()).block();
    }

    Mono<List<NewAction>> getActions(String pageId) {
        return newActionService.findByPageId(pageId).collectList();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithInvalidApplicationIdTest() {

        Mono<CRUDPageResponseDTO> resultMono =
                solution.createPageFromDBTable(testApp.getPages().get(0).getId(), resource, testDefaultEnvironmentId);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATION_ID)))
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
        Mono<CRUDPageResponseDTO> resultMono = datasourceService
                .create(invalidDatasource)
                .flatMap(datasource -> {
                    resource.setApplicationId(testApp.getId());
                    resource.setDatasourceId(datasource.getId());
                    return solution.createPageFromDBTable(
                            testApp.getPages().get(0).getId(), resource, testDefaultEnvironmentId);
                });

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.PLUGIN_ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithInvalidRequestBodyTest() {
        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(
                testApp.getPages().get(0).getId(), new CRUDPageResourceDTO(), testDefaultEnvironmentId);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.INVALID_PARAMETER.getMessage("tableName and datasourceId")))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageId() {

        resource.setApplicationId(testApp.getId());
        Mono<CRUDPageResponseDTO> resultMono = solution.createPageFromDBTable(null, resource, testDefaultEnvironmentId);

        StepVerifier.create(resultMono)
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
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setBranchName("crudTestBranch");
        gitConnectedApp.setGitApplicationMetadata(gitData);
        applicationPageService
                .createApplication(gitConnectedApp, testWorkspace.getId())
                .flatMap(application -> {
                    application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                    gitData.setDefaultApplicationId(application.getId());
                    return applicationService.save(application).zipWhen(application1 -> exportService
                            .exportByArtifactIdAndBranchName(application1.getId(), gitData.getBranchName(), APPLICATION)
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson));
                })
                // Assign the branchName to all the resources connected to the application
                .flatMap(tuple -> importService.importArtifactInWorkspaceFromGit(
                        testWorkspace.getId(), tuple.getT1().getId(), tuple.getT2(), gitData.getBranchName()))
                .map(importableArtifact -> (Application) importableArtifact)
                .block();

        resource.setApplicationId(gitData.getDefaultApplicationId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(gitData.getDefaultApplicationId());
        newPage.setName("crud-admin-page-with-git-connected-app");

        Mono<NewPage> resultMono = applicationPageService
                .createPage(newPage)
                .flatMap(savedPage ->
                        solution.createPageFromDBTable(savedPage.getId(), resource, testDefaultEnvironmentId))
                .flatMap(crudPageResponseDTO -> newPageService.findByBranchNameAndBasePageId(
                        gitData.getBranchName(), crudPageResponseDTO.getPage().getId(), READ_PAGES, null));

        StepVerifier.create(resultMono.zipWhen(newPage1 -> getActions(newPage1.getId())))
                .assertNext(tuple -> {
                    NewPage newPage1 = tuple.getT1();
                    List<NewAction> actionList = tuple.getT2();

                    PageDTO page = newPage1.getUnpublishedPage();
                    Layout layout = page.getLayouts().get(0);
                    assertThat(page.getName()).isEqualTo("crud-admin-page-with-git-connected-app");

                    assertThat(newPage1.getBranchName()).isEqualTo(gitData.getBranchName());
                    assertThat(newPage1.getBaseId()).isEqualTo(newPage1.getId());

                    assertThat(actionList).hasSize(4);
                    NewAction newAction = actionList.get(0);
                    assertThat(newAction.getBaseId())
                            .isEqualTo(actionList.get(0).getId());
                    assertThat(newAction.getBranchName()).isEqualTo(gitData.getBranchName());
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

        Mono<PageDTO> resultMono = applicationPageService
                .createPage(newPage)
                .flatMap(savedPage ->
                        solution.createPageFromDBTable(savedPage.getId(), resource, testDefaultEnvironmentId))
                .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier.create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
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
                        String templateActionBody = actionNameToBodyMap
                                .get(action.getUnpublishedAction().getName())
                                .replaceAll(specialCharactersRegex, "")
                                .replace("like", "ilike");
                        assertThat(actionBody).isEqualTo(templateActionBody);
                        if (!StringUtils.equals(unpublishedAction.getName(), SELECT_QUERY)) {
                            assertThat(actionConfiguration
                                            .getPluginSpecifiedTemplates()
                                            .get(0)
                                            .getValue())
                                    .isEqualTo(Boolean.TRUE);
                        }
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithLessColumnsComparedToTemplateForPostgres() {

        CRUDPageResourceDTO resourceDTO = new CRUDPageResourceDTO();
        resourceDTO.setTableName(
                testDatasourceStructure.getStructure().getTables().get(1).getName());
        resourceDTO.setDatasourceId(testDatasource.getId());
        resourceDTO.setApplicationId(testApp.getId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page-postgres-with-less-columns");

        Mono<CRUDPageResponseDTO> resultMono = applicationPageService
                .createPage(newPage)
                .flatMap(savedPage ->
                        solution.createPageFromDBTable(savedPage.getId(), resourceDTO, testDefaultEnvironmentId));

        StepVerifier.create(resultMono.zipWhen(crudPageResponseDTO ->
                        getActions(crudPageResponseDTO.getPage().getId())))
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
                        ActionConfiguration actionConfiguration =
                                action.getUnpublishedAction().getActionConfiguration();
                        String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                        String actionName;
                        if (StringUtils.equals(action.getUnpublishedAction().getName(), UPDATE_QUERY)) {
                            actionName = "UpdateActionWithLessColumns";
                        } else if (StringUtils.equals(
                                action.getUnpublishedAction().getName(), INSERT_QUERY)) {
                            actionName = "InsertActionWithLessColumns";
                        } else {
                            actionName = action.getUnpublishedAction().getName();
                        }

                        String templateActionBody = actionNameToBodyMap
                                .get(actionName)
                                .replaceAll(specialCharactersRegex, "")
                                .replace("like", "ilike")
                                .replace(
                                        structure.getTables().get(0).getName(),
                                        structure.getTables().get(1).getName());
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
        resourceDTO.setTableName(
                testDatasourceStructure.getStructure().getTables().get(1).getName());
        resourceDTO.setDatasourceId(testDatasource.getId());
        resourceDTO.setApplicationId(testApp.getId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page-mysql");
        StringBuilder pluginName = new StringBuilder();

        Mono<Datasource> datasourceMono = pluginRepository
                .findByName("MySQL")
                .flatMap(plugin -> {
                    pluginName.append(plugin.getName());
                    Datasource datasource = new Datasource();
                    datasource.setPluginId(plugin.getId());
                    datasource.setWorkspaceId(testWorkspace.getId());
                    datasource.setName("MySql-CRUD-Page-Table-With-Less-Columns-DS");

                    HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                    storages.put(
                            testDefaultEnvironmentId,
                            new DatasourceStorageDTO(null, testDefaultEnvironmentId, datasourceConfiguration));
                    datasource.setDatasourceStorages(storages);

                    return datasourceService.create(datasource);
                })
                .flatMap(datasource -> {
                    DatasourceStorageStructure datasourceStorageStructure = new DatasourceStorageStructure();
                    datasourceStorageStructure.setDatasourceId(datasource.getId());
                    datasourceStorageStructure.setEnvironmentId(testDefaultEnvironmentId);
                    datasourceStorageStructure.setStructure(structure);

                    return datasourceStructureService
                            .save(datasourceStorageStructure)
                            .thenReturn(datasource);
                });

        Mono<CRUDPageResponseDTO> resultMono = datasourceMono
                .flatMap(datasource1 -> {
                    resourceDTO.setDatasourceId(datasource1.getId());
                    return applicationPageService.createPage(newPage);
                })
                .flatMap(savedPage ->
                        solution.createPageFromDBTable(savedPage.getId(), resourceDTO, testDefaultEnvironmentId));

        StepVerifier.create(resultMono.zipWhen(crudPageResponseDTO ->
                        getActions(crudPageResponseDTO.getPage().getId())))
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
                        ActionConfiguration actionConfiguration =
                                action.getUnpublishedAction().getActionConfiguration();
                        String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                        String actionName;
                        if (StringUtils.equals(action.getUnpublishedAction().getName(), UPDATE_QUERY)) {
                            actionName = "UpdateActionWithLessColumns";
                        } else if (StringUtils.equals(
                                action.getUnpublishedAction().getName(), INSERT_QUERY)) {
                            actionName = "InsertActionWithLessColumns";
                        } else {
                            actionName = action.getUnpublishedAction().getName();
                        }

                        String templateActionBody = actionNameToBodyMap
                                .get(actionName)
                                .replaceAll(specialCharactersRegex, "")
                                .replace(
                                        structure.getTables().get(0).getName(),
                                        structure.getTables().get(1).getName());
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

        Mono<Datasource> datasourceMono = pluginRepository.findByName("MySQL").flatMap(plugin -> {
            pluginName.append(plugin.getName());
            Datasource datasource = new Datasource();
            datasource.setPluginId(plugin.getId());
            datasource.setWorkspaceId(testWorkspace.getId());
            datasource.setName("MySql-CRUD-Page-Table-DS");

            HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
            storages.put(
                    testDefaultEnvironmentId,
                    new DatasourceStorageDTO(null, testDefaultEnvironmentId, datasourceConfiguration));
            datasource.setDatasourceStorages(storages);

            return datasourceService.create(datasource).flatMap(datasource1 -> {
                DatasourceStorageStructure datasourceStorageStructure = new DatasourceStorageStructure();
                datasourceStorageStructure.setDatasourceId(datasource1.getId());
                datasourceStorageStructure.setEnvironmentId(testDefaultEnvironmentId);
                datasourceStorageStructure.setStructure(structure);

                return datasourceStructureService
                        .save(datasourceStorageStructure)
                        .thenReturn(datasource1);
            });
        });

        Mono<CRUDPageResponseDTO> resultMono = datasourceMono
                .flatMap(datasource1 -> {
                    resource.setDatasourceId(datasource1.getId());
                    return applicationPageService.createPage(newPage);
                })
                .flatMap(savedPage ->
                        solution.createPageFromDBTable(savedPage.getId(), resource, testDefaultEnvironmentId));

        StepVerifier.create(resultMono.zipWhen(crudPageResponseDTO ->
                        getActions(crudPageResponseDTO.getPage().getId())))
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
                        ActionConfiguration actionConfiguration =
                                action.getUnpublishedAction().getActionConfiguration();
                        String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                        String templateActionBody = actionNameToBodyMap
                                .get(action.getUnpublishedAction().getName())
                                .replaceAll(specialCharactersRegex, "");
                        assertThat(actionBody).isEqualTo(templateActionBody);

                        if (SELECT_QUERY.equals(action.getUnpublishedAction().getName())) {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isTrue();
                        } else {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isFalse();
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

        Mono<Datasource> datasourceMono = pluginRepository
                .findByName("Redshift")
                .flatMap(plugin -> {
                    Datasource datasource = new Datasource();
                    datasource.setPluginId(plugin.getId());
                    datasource.setWorkspaceId(testWorkspace.getId());
                    datasource.setName("Redshift-CRUD-Page-Table-DS");

                    HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                    storages.put(
                            testDefaultEnvironmentId,
                            new DatasourceStorageDTO(null, testDefaultEnvironmentId, datasourceConfiguration));
                    datasource.setDatasourceStorages(storages);

                    return datasourceService.create(datasource).flatMap(datasource1 -> {
                        DatasourceStorageStructure datasourceStorageStructure = new DatasourceStorageStructure();
                        datasourceStorageStructure.setDatasourceId(datasource1.getId());
                        datasourceStorageStructure.setEnvironmentId(testDefaultEnvironmentId);
                        datasourceStorageStructure.setStructure(structure);

                        return datasourceStructureService
                                .save(datasourceStorageStructure)
                                .thenReturn(datasource1);
                    });
                });

        Mono<PageDTO> resultMono = datasourceMono
                .flatMap(datasource1 -> {
                    resource.setDatasourceId(datasource1.getId());
                    return applicationPageService.createPage(newPage);
                })
                .flatMap(savedPage ->
                        solution.createPageFromDBTable(savedPage.getId(), resource, testDefaultEnvironmentId))
                .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier.create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
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
                        ActionConfiguration actionConfiguration =
                                action.getUnpublishedAction().getActionConfiguration();
                        String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                        String templateActionBody = actionNameToBodyMap
                                .get(action.getUnpublishedAction().getName())
                                .replaceAll(specialCharactersRegex, "");
                        assertThat(actionBody).isEqualTo(templateActionBody);

                        if (SELECT_QUERY.equals(action.getUnpublishedAction().getName())) {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isTrue();
                        } else {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isFalse();
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

        Mono<Datasource> datasourceMono = pluginRepository
                .findByName("Snowflake")
                .flatMap(plugin -> {
                    Datasource datasource = new Datasource();
                    datasource.setPluginId(plugin.getId());
                    datasource.setWorkspaceId(testWorkspace.getId());
                    datasource.setName("Snowflake-CRUD-Page-Table-DS");

                    HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                    storages.put(
                            testDefaultEnvironmentId,
                            new DatasourceStorageDTO(null, testDefaultEnvironmentId, datasourceConfiguration));
                    datasource.setDatasourceStorages(storages);

                    return datasourceService.create(datasource).flatMap(datasource1 -> {
                        DatasourceStorageStructure datasourceStorageStructure = new DatasourceStorageStructure();
                        datasourceStorageStructure.setDatasourceId(datasource1.getId());
                        datasourceStorageStructure.setEnvironmentId(testDefaultEnvironmentId);
                        datasourceStorageStructure.setStructure(structure);

                        return datasourceStructureService
                                .save(datasourceStorageStructure)
                                .thenReturn(datasource1);
                    });
                });

        Mono<PageDTO> resultMono = datasourceMono
                .flatMap(datasource1 -> {
                    resource.setDatasourceId(datasource1.getId());
                    return solution.createPageFromDBTable(null, resource, testDefaultEnvironmentId);
                })
                .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier.create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
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
                        ActionConfiguration actionConfiguration =
                                action.getUnpublishedAction().getActionConfiguration();
                        String actionBody = actionConfiguration.getBody().replaceAll(specialCharactersRegex, "");
                        String templateActionBody = actionNameToBodyMap
                                .get(action.getUnpublishedAction().getName())
                                .replaceAll(specialCharactersRegex, "");
                        assertThat(actionBody).isEqualTo(templateActionBody);
                        if (SELECT_QUERY.equals(action.getUnpublishedAction().getName())) {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isTrue();
                        } else {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isFalse();
                        }
                    }
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageIdForS3() {
        /**
         * Define handling for sanitizeGenerateCRUDPageTemplateInfo method for S3 plugin on spyMockPluginExecutor.
         */
        doAnswer(invocation -> {
                    List<ActionConfiguration> actionConfigurationList = invocation.getArgument(0);
                    Map<String, String> mappedColumnsAndTableName = invocation.getArgument(1);
                    String bucketName = invocation.getArgument(2);
                    Map<String, Object> formData =
                            actionConfigurationList.get(0).getFormData();
                    mappedColumnsAndTableName.put(
                            (String) ((Map<?, ?>) formData.get("bucket")).get("data"), bucketName);
                    return Mono.empty();
                })
                .when(spyMockPluginExecutor)
                .sanitizeGenerateCRUDPageTemplateInfo(any(), any(), any());

        resource.setApplicationId(testApp.getId());
        StringBuilder pluginName = new StringBuilder();

        Mono<Datasource> datasourceMono = pluginRepository.findByName("S3").flatMap(plugin -> {
            Datasource datasource = new Datasource();
            datasource.setPluginId(plugin.getId());
            datasource.setWorkspaceId(testWorkspace.getId());
            datasource.setName("S3-CRUD-Page-Table-DS");
            pluginName.append(plugin.getName());

            HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
            storages.put(
                    testDefaultEnvironmentId,
                    new DatasourceStorageDTO(null, testDefaultEnvironmentId, datasourceConfiguration));
            datasource.setDatasourceStorages(storages);

            return datasourceService.create(datasource).flatMap(datasource1 -> {
                DatasourceStorageStructure datasourceStorageStructure = new DatasourceStorageStructure();
                datasourceStorageStructure.setDatasourceId(datasource1.getId());
                datasourceStorageStructure.setStructure(structure);

                return datasourceStructureService
                        .save(datasourceStorageStructure)
                        .thenReturn(datasource1);
            });
        });

        Mono<CRUDPageResponseDTO> resultMono = datasourceMono.flatMap(datasource1 -> {
            resource.setDatasourceId(datasource1.getId());
            return solution.createPageFromDBTable(null, resource, testDefaultEnvironmentId);
        });

        StepVerifier.create(resultMono.zipWhen(crudPageResponseDTO ->
                        getActions(crudPageResponseDTO.getPage().getId())))
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
                        ActionConfiguration actionConfiguration =
                                action.getUnpublishedAction().getActionConfiguration();
                        assertThat(((Map<String, String>) actionConfiguration
                                                .getFormData()
                                                .get("bucket"))
                                        .get(DATA))
                                .isEqualTo(resource.getTableName());
                        if (action.getUnpublishedAction().getName().equals(LIST_QUERY)) {
                            Map<String, Object> listObject = (Map<String, Object>)
                                    actionConfiguration.getFormData().get("list");
                            assertThat(((Map<String, Object>) ((Map<String, Object>) listObject.get("where")).get(DATA))
                                            .get("condition"))
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
        pluginSpecificFields.put("tableHeaderIndex", "1");
        pluginSpecificFields.put("sheetName", "CRUD_Sheet");
        resource.setPluginSpecificParams(pluginSpecificFields);

        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page-GoogleSheet");

        Mono<Datasource> datasourceMono = pluginRepository
                .findByName("Google Sheets")
                .flatMap(plugin -> {
                    Datasource datasource = new Datasource();
                    datasource.setPluginId(plugin.getId());
                    datasource.setWorkspaceId(testWorkspace.getId());
                    datasource.setName("Google-Sheet-CRUD-Page-Table-DS");

                    HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
                    storages.put(
                            testDefaultEnvironmentId,
                            new DatasourceStorageDTO(null, testDefaultEnvironmentId, datasourceConfiguration));
                    datasource.setDatasourceStorages(storages);

                    return datasourceService.create(datasource).flatMap(datasource1 -> {
                        DatasourceStorageStructure datasourceStorageStructure = new DatasourceStorageStructure();
                        datasourceStorageStructure.setDatasourceId(datasource1.getId());
                        datasourceStorageStructure.setStructure(structure);

                        return datasourceStructureService
                                .save(datasourceStorageStructure)
                                .thenReturn(datasource1);
                    });
                });

        Mono<PageDTO> resultMono = datasourceMono
                .flatMap(datasource1 -> {
                    resource.setDatasourceId(datasource1.getId());
                    return applicationPageService.createPage(newPage);
                })
                .flatMap(savedPage ->
                        solution.createPageFromDBTable(savedPage.getId(), resource, testDefaultEnvironmentId))
                .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier.create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
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
                        ActionConfiguration actionConfiguration =
                                action.getUnpublishedAction().getActionConfiguration();
                        if (SELECT_QUERY.equals(action.getUnpublishedAction().getName())) {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isTrue();
                        } else {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isFalse();
                        }

                        List<Property> pluginSpecifiedTemplate = actionConfiguration.getPluginSpecifiedTemplates();
                        pluginSpecifiedTemplate.forEach(template -> {
                            if (pluginSpecificFields.containsKey(template.getKey())) {
                                assertThat(template.getValue().toString())
                                        .isEqualTo(pluginSpecificFields.get(template.getKey()));
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

        Mono<Datasource> datasourceMono = pluginRepository.findByName("MongoDB").flatMap(plugin -> {
            Datasource datasource = new Datasource();
            datasource.setPluginId(plugin.getId());
            datasource.setWorkspaceId(testWorkspace.getId());
            datasource.setName("Mongo-CRUD-Page-Table-DS");

            HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
            storages.put(
                    testDefaultEnvironmentId,
                    new DatasourceStorageDTO(null, testDefaultEnvironmentId, datasourceConfiguration));
            datasource.setDatasourceStorages(storages);

            return datasourceService.create(datasource).flatMap(datasource1 -> {
                DatasourceStorageStructure datasourceStorageStructure = new DatasourceStorageStructure();
                datasourceStorageStructure.setDatasourceId(datasource1.getId());
                datasourceStorageStructure.setEnvironmentId(testDefaultEnvironmentId);
                datasourceStorageStructure.setStructure(structure);

                return datasourceStructureService
                        .save(datasourceStorageStructure)
                        .thenReturn(datasource1);
            });
        });

        Mono<PageDTO> resultMono = datasourceMono
                .flatMap(datasource1 -> {
                    resource.setDatasourceId(datasource1.getId());
                    return applicationPageService.createPage(newPage);
                })
                .flatMap(savedPage ->
                        solution.createPageFromDBTable(savedPage.getId(), resource, testDefaultEnvironmentId))
                .map(crudPageResponseDTO -> crudPageResponseDTO.getPage());

        StepVerifier.create(resultMono.zipWhen(pageDTO -> getActions(pageDTO.getId())))
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
                        ActionConfiguration actionConfiguration =
                                action.getUnpublishedAction().getActionConfiguration();
                        if (FIND_QUERY.equals(action.getUnpublishedAction().getName())) {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isTrue();
                        } else {
                            assertThat(action.getUnpublishedAction().getExecuteOnLoad())
                                    .isFalse();
                        }

                        Map<String, Object> formData = actionConfiguration.getFormData();
                        assertThat(((Map<String, Object>) formData.get("collection")).get(DATA))
                                .isEqualTo("sampleTable");
                        String queryType = ((Map<String, String>) formData.get("command")).get(DATA);
                        if (queryType.equals("UPDATE")) {
                            Map<String, Object> updateMany = (Map<String, Object>) formData.get("updateMany");
                            assertThat(((Map<String, String>) updateMany.get("query"))
                                            .get(DATA)
                                            .replaceAll(specialCharactersRegex, ""))
                                    .isEqualTo("{ id: ObjectId('{{data_table.selectedRow.id}}') }"
                                            .replaceAll(specialCharactersRegex, ""));

                            assertThat(((Map<String, Object>) updateMany.get("update")).get(DATA))
                                    .isEqualTo("{\n" + "  $set:{{update_form.formData}}\n"
                                            + "}".replaceAll(specialCharactersRegex, ""));
                            assertThat(((Map<String, Object>) formData.get("smartSubstitution")).get(DATA))
                                    .isEqualTo(true);
                        } else if (queryType.equals("DELETE")) {
                            Map<String, Object> delete = (Map<String, Object>) formData.get("delete");
                            assertThat(((Map<String, String>) delete.get("query"))
                                            .get(DATA)
                                            .replaceAll(specialCharactersRegex, ""))
                                    .isEqualTo("{ id: ObjectId('{{data_table.triggeredRow.id}}') }"
                                            .replaceAll(specialCharactersRegex, ""));
                            assertThat(((Map<String, Object>) formData.get("smartSubstitution")).get(DATA))
                                    .isEqualTo(true);
                        } else if (queryType.equals("FIND")) {

                            Map<String, Object> find = (Map<String, Object>) formData.get("find");
                            assertThat(((Map<String, Object>) find.get("sort"))
                                            .get(DATA)
                                            .toString()
                                            .replaceAll(specialCharactersRegex, ""))
                                    .isEqualTo(
                                            "{ \n{{data_table.sortOrder.column || 'field2'}}: {{data_table.sortOrder.order == \"desc\" ? -1 : 1}}}"
                                                    .replaceAll(specialCharactersRegex, ""));

                            assertThat(((Map<String, Object>) find.get("limit"))
                                            .get(DATA)
                                            .toString())
                                    .isEqualTo("{{data_table.pageSize}}");

                            assertThat(((Map<String, Object>) find.get("skip"))
                                            .get(DATA)
                                            .toString())
                                    .isEqualTo("{{(data_table.pageNo - 1) * data_table.pageSize}}");

                            assertThat(((Map<String, Object>) find.get("query"))
                                            .get(DATA)
                                            .toString()
                                            .replaceAll(specialCharactersRegex, ""))
                                    .isEqualTo("{ field1.something: /{{data_table.searchText||\"\"}}/i }"
                                            .replaceAll(specialCharactersRegex, ""));

                            assertThat(((Map<String, Object>) formData.get("smartSubstitution")).get(DATA))
                                    .isEqualTo(false);
                        } else if (queryType.equals("INSERT")) {
                            Map<String, Object> insert = (Map<String, Object>) formData.get("insert");

                            assertThat(((Map<String, Object>) insert.get("documents")).get(DATA))
                                    .isEqualTo("{{insert_form.formData}}");
                            assertThat(((Map<String, Object>) formData.get("smartSubstitution")).get(DATA))
                                    .isEqualTo(true);
                        }
                    }
                })
                .verifyComplete();
    }
}
