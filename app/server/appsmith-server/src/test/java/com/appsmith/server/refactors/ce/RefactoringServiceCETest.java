package com.appsmith.server.refactors.ce;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.cakes.NewActionRepositoryCake;
import com.appsmith.server.repositories.cakes.PluginRepositoryCake;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.ArtifactType.APPLICATION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith({AfterAllCleanUpExtension.class})
@SpringBootTest
@Slf4j
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class RefactoringServiceCETest {

    @SpyBean
    NewActionService newActionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PluginRepositoryCake pluginRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    UpdateLayoutService updateLayoutService;

    @Autowired
    RefactoringService refactoringService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionRepositoryCake actionRepository;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    SessionUserService sessionUserService;

    Application testApp = null;

    PageDTO testPage = null;

    Application gitConnectedApp = null;

    PageDTO gitConnectedPage = null;

    Datasource datasource;

    String workspaceId;

    String branchName;

    Datasource jsDatasource;

    @BeforeEach
    public void setup() {
        newPageService.deleteAll().block();
        User currentUser = sessionUserService.getCurrentUser().block();
        Workspace toCreate = new Workspace();
        toCreate.setName("LayoutActionServiceTest");

        Workspace workspace =
                workspaceService.create(toCreate, currentUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        // Create application and page which will be used by the tests to create actions for.
        Application application = new Application();
        application.setName(UUID.randomUUID().toString());
        testApp = applicationPageService
                .createApplication(application, workspace.getId())
                .block();

        final String pageId = testApp.getPages().get(0).getId();

        testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();

        Layout layout = testPage.getLayouts().get(0);
        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField")), new JSONObject(Map.of("key", "testField2"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ query1.data }}");
        dsl.put("testField2", "{{jsObject.jsFunction.data}}");

        JSONObject dsl2 = new JSONObject();
        dsl2.put("widgetName", "Table1");
        dsl2.put("type", "TABLE_WIDGET");
        Map<String, Object> primaryColumns = new HashMap<>();
        JSONObject jsonObject = new JSONObject(Map.of("key", "value"));
        primaryColumns.put("_id", "{{ query1.data }}");
        primaryColumns.put("_class", jsonObject);
        dsl2.put("primaryColumns", primaryColumns);
        final ArrayList<Object> objects = new ArrayList<>();
        JSONArray temp2 = new JSONArray();
        temp2.add(new JSONObject(Map.of("key", "primaryColumns._id")));
        dsl2.put("dynamicBindingPathList", temp2);
        objects.add(dsl2);
        dsl.put("children", objects);

        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);
        updateLayoutService
                .updateLayout(pageId, testApp.getId(), layout.getId(), layout)
                .block();

        testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();

        Application newApp = new Application();
        newApp.setName(UUID.randomUUID().toString());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
        gitData.setRefName("actionServiceTest");
        newApp.setGitApplicationMetadata(gitData);
        gitConnectedApp = applicationPageService
                .createApplication(newApp, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1).zipWhen(application11 -> exportService
                            .exportByArtifactIdAndBranchName(application11.getId(), gitData.getRefName(), APPLICATION)
                            .map(artifactExchangeJson -> (ApplicationJson) artifactExchangeJson));
                })
                // Assign the branchName to all the resources connected to the application
                .flatMap(tuple -> importService.importArtifactInWorkspaceFromGit(
                        workspaceId, tuple.getT1().getId(), tuple.getT2(), gitData.getRefName()))
                .map(importableArtifact -> (Application) importableArtifact)
                .block();

        gitConnectedPage = newPageService
                .findPageById(gitConnectedApp.getPages().get(0).getId(), READ_PAGES, false)
                .block();

        branchName = gitConnectedApp.getGitApplicationMetadata().getRefName();

        workspaceId = workspace.getId();
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin =
                pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS Database");
        jsDatasource.setWorkspaceId(workspaceId);
        Plugin installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        jsDatasource.setPluginId(installedJsPlugin.getId());
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
    public void refactorActionName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("beforeNameChange");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "firstWidgetId");
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(
                new JSONObject(Map.of("key", "innerArrayReference[0].innerK")),
                new JSONObject(Map.of("key", "innerObjectReference.k")),
                new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ \tbeforeNameChange.data }}");
        final JSONObject innerObjectReference = new JSONObject();
        innerObjectReference.put("k", "{{\tbeforeNameChange.data}}");
        dsl.put("innerObjectReference", innerObjectReference);
        final JSONArray innerArrayReference = new JSONArray();
        innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tbeforeNameChange.data}}")));
        dsl.put("innerArrayReference", innerArrayReference);

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        LayoutDTO firstLayout = updateLayoutService
                .updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout)
                .block();

        RefactorEntityNameDTO refactorActionNameDTO = new RefactorEntityNameDTO();
        refactorActionNameDTO.setEntityType(EntityType.ACTION);
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("beforeNameChange");
        refactorActionNameDTO.setNewName("PostNameChange");
        refactorActionNameDTO.setActionId(createdAction.getId());

        LayoutDTO postNameChangeLayout =
                refactoringService.refactorEntityName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(createdAction.getId(), READ_ACTIONS);

        StepVerifier.create(postNameChangeActionMono)
                .assertNext(updatedAction -> {
                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("PostNameChange");

                    DslExecutableDTO actionDTO = postNameChangeLayout
                            .getLayoutOnLoadActions()
                            .get(0)
                            .iterator()
                            .next();
                    assertThat(actionDTO.getName()).isEqualTo("PostNameChange");

                    dsl.put("testField", "{{ \tPostNameChange.data }}");
                    innerObjectReference.put("k", "{{\tPostNameChange.data}}");
                    innerArrayReference.clear();
                    innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tPostNameChange.data}}")));
                    assertThat(postNameChangeLayout.getDsl()).isEqualTo(dsl);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void refactorActionName_forGitConnectedAction_success() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("beforeNameChange");
        action.setPageId(gitConnectedPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "firstWidgetId");
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.addAll(List.of(
                new JSONObject(Map.of("key", "innerArrayReference[0].innerK")),
                new JSONObject(Map.of("key", "innerObjectReference.k")),
                new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ \tbeforeNameChange.data }}");
        final JSONObject innerObjectReference = new JSONObject();
        innerObjectReference.put("k", "{{\tbeforeNameChange.data}}");
        dsl.put("innerObjectReference", innerObjectReference);
        final JSONArray innerArrayReference = new JSONArray();
        innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tbeforeNameChange.data}}")));
        dsl.put("innerArrayReference", innerArrayReference);

        Layout layout = gitConnectedPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        LayoutDTO firstLayout = updateLayoutService
                .updateLayout(gitConnectedPage.getId(), testApp.getId(), layout.getId(), layout)
                .block();

        RefactorEntityNameDTO refactorActionNameDTO = new RefactorEntityNameDTO();
        refactorActionNameDTO.setEntityType(EntityType.ACTION);
        refactorActionNameDTO.setPageId(gitConnectedPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("beforeNameChange");
        refactorActionNameDTO.setNewName("PostNameChange");
        refactorActionNameDTO.setActionId(createdAction.getId());

        LayoutDTO postNameChangeLayout =
                refactoringService.refactorEntityName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(createdAction.getId(), READ_ACTIONS);

        StepVerifier.create(postNameChangeActionMono)
                .assertNext(updatedAction -> {
                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("PostNameChange");

                    DslExecutableDTO actionDTO = postNameChangeLayout
                            .getLayoutOnLoadActions()
                            .get(0)
                            .iterator()
                            .next();
                    assertThat(actionDTO.getName()).isEqualTo("PostNameChange");

                    dsl.put("testField", "{{ \tPostNameChange.data }}");
                    innerObjectReference.put("k", "{{\tPostNameChange.data}}");
                    innerArrayReference.clear();
                    innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tPostNameChange.data}}")));
                    assertThat(postNameChangeLayout.getDsl()).isEqualTo(dsl);
                    assertThat(updatedAction.getBaseId()).isEqualTo(updatedAction.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void refactorActionNameToDeletedName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("Query1");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Layout layout = testPage.getLayouts().get(0);

        ActionDTO firstAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        layout.setDsl(updateLayoutService.unescapeMongoSpecialCharacters(layout));
        LayoutDTO firstLayout = updateLayoutService
                .updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout)
                .block();

        applicationPageService.publish(testPage.getApplicationId(), true).block();

        newActionService.deleteUnpublishedAction(firstAction.getId()).block();

        // Create another action with the same name as the erstwhile deleted action
        action.setId(null);
        ActionDTO secondAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        RefactorEntityNameDTO refactorActionNameDTO = new RefactorEntityNameDTO();
        refactorActionNameDTO.setEntityType(EntityType.ACTION);
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("Query1");
        refactorActionNameDTO.setNewName("NewActionName");
        refactorActionNameDTO.setActionId(secondAction.getId());

        refactoringService.refactorEntityName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(secondAction.getId(), READ_ACTIONS);

        StepVerifier.create(postNameChangeActionMono)
                .assertNext(updatedAction -> {
                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("NewActionName");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testRefactorActionName_withInvalidName_throwsError() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("beforeNameChange");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField")));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ beforeNameChange.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO createdAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        LayoutDTO firstLayout = updateLayoutService
                .updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout)
                .block();

        RefactorEntityNameDTO refactorActionNameDTO = new RefactorEntityNameDTO();
        refactorActionNameDTO.setEntityType(EntityType.ACTION);
        refactorActionNameDTO.setPageId(testPage.getId());
        assert firstLayout != null;
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("beforeNameChange");
        refactorActionNameDTO.setNewName("!PostNameChange");
        assert createdAction != null;
        refactorActionNameDTO.setActionId(createdAction.getId());

        final Mono<LayoutDTO> layoutDTOMono = refactoringService.refactorEntityName(refactorActionNameDTO);

        StepVerifier.create(layoutDTOMono)
                .expectErrorMatches(e -> e instanceof AppsmithException
                        && AppsmithError.INVALID_ACTION_NAME.getMessage().equalsIgnoreCase(e.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void refactorDuplicateActionName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        String name = "duplicateName";

        ActionDTO action = new ActionDTO();
        action.setName(name);
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "firstWidgetId");
        dsl.put("widgetName", "firstWidget");
        JSONArray temp = new JSONArray();
        temp.add(new JSONObject(Map.of("key", "testField")));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ duplicateName.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO firstAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        ActionDTO duplicateName = new ActionDTO();
        duplicateName.setName(name);
        duplicateName.setPageId(testPage.getId());
        duplicateName.setActionConfiguration(actionConfiguration);
        duplicateName.setDatasource(datasource);

        NewAction duplicateNameCompleteAction = new NewAction();
        duplicateNameCompleteAction.setUnpublishedAction(duplicateName);
        duplicateNameCompleteAction.setPublishedAction(new ActionDTO());
        duplicateNameCompleteAction.getPublishedAction().setDatasource(new Datasource());
        duplicateNameCompleteAction.setWorkspaceId(duplicateName.getWorkspaceId());
        duplicateNameCompleteAction.setPluginType(duplicateName.getPluginType());
        duplicateNameCompleteAction.setPluginId(duplicateName.getPluginId());
        duplicateNameCompleteAction.setDocumentation(duplicateName.getDocumentation());
        duplicateNameCompleteAction.setApplicationId(duplicateName.getApplicationId());

        // Now save this action directly in the repo to create a duplicate action name scenario
        newActionService
                .validateAction(duplicateNameCompleteAction)
                .flatMap(validatedAction -> actionRepository.save(validatedAction))
                .block();

        LayoutDTO firstLayout = updateLayoutService
                .updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout)
                .block();

        RefactorEntityNameDTO refactorActionNameDTO = new RefactorEntityNameDTO();
        refactorActionNameDTO.setEntityType(EntityType.ACTION);
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("duplicateName");
        refactorActionNameDTO.setNewName("newName");
        refactorActionNameDTO.setActionId(firstAction.getId());

        LayoutDTO postNameChangeLayout =
                refactoringService.refactorEntityName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(firstAction.getId(), READ_ACTIONS);

        StepVerifier.create(postNameChangeActionMono)
                .assertNext(updatedAction -> {
                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("newName");

                    DslExecutableDTO actionDTO = postNameChangeLayout
                            .getLayoutOnLoadActions()
                            .get(0)
                            .iterator()
                            .next();
                    assertThat(actionDTO.getName()).isEqualTo("newName");

                    dsl.put("testField", "{{ newName.data }}");
                    assertThat(postNameChangeLayout.getDsl()).isEqualTo(dsl);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void tableWidgetKeyEscapeRefactorName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "testId");
        dsl.put("widgetName", "Table1");
        dsl.put("type", "TABLE_WIDGET");
        Map primaryColumns = new HashMap<String, Object>();
        JSONObject jsonObject = new JSONObject(Map.of("key", "value"));
        primaryColumns.put("_id", jsonObject);
        primaryColumns.put("_class", jsonObject);
        dsl.put("primaryColumns", primaryColumns);
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        updateLayoutService
                .updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout)
                .block();

        RefactorEntityNameDTO refactorNameDTO = new RefactorEntityNameDTO();
        refactorNameDTO.setEntityType(EntityType.WIDGET);
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("Table1");
        refactorNameDTO.setNewName("NewNameTable1");

        Mono<LayoutDTO> widgetRenameMono =
                refactoringService.refactorEntityName(refactorNameDTO).cache();

        Mono<PageDTO> pageFromRepoMono =
                widgetRenameMono.then(newPageService.findPageById(testPage.getId(), READ_PAGES, false));

        StepVerifier.create(Mono.zip(widgetRenameMono, pageFromRepoMono))
                .assertNext(tuple -> {
                    LayoutDTO updatedLayout = tuple.getT1();
                    PageDTO pageFromRepo = tuple.getT2();

                    String widgetName = (String) updatedLayout.getDsl().get("widgetName");
                    assertThat(widgetName).isEqualTo("NewNameTable1");

                    Map primaryColumns1 = (Map) updatedLayout.getDsl().get("primaryColumns");
                    assertThat(primaryColumns1.keySet())
                            .containsAll(Set.of(FieldName.MONGO_UNESCAPED_ID, FieldName.MONGO_UNESCAPED_CLASS));

                    Map primaryColumns2 =
                            (Map) pageFromRepo.getLayouts().get(0).getDsl().get("primaryColumns");
                    assertThat(primaryColumns2.keySet())
                            .containsAll(Set.of(FieldName.MONGO_ESCAPE_ID, FieldName.MONGO_ESCAPE_CLASS));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void simpleWidgetNameRefactor() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "simpleRefactorId");
        dsl.put("widgetName", "Table1");
        dsl.put("type", "TABLE_WIDGET");
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        updateLayoutService
                .updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout)
                .block();

        RefactorEntityNameDTO refactorNameDTO = new RefactorEntityNameDTO();
        refactorNameDTO.setEntityType(EntityType.WIDGET);
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("Table1");
        refactorNameDTO.setNewName("NewNameTable1");

        Mono<LayoutDTO> widgetRenameMono =
                refactoringService.refactorEntityName(refactorNameDTO).cache();

        Mono<PageDTO> pageFromRepoMono =
                widgetRenameMono.then(newPageService.findPageById(testPage.getId(), READ_PAGES, false));

        StepVerifier.create(Mono.zip(widgetRenameMono, pageFromRepoMono))
                .assertNext(tuple -> {
                    LayoutDTO updatedLayout = tuple.getT1();
                    PageDTO pageFromRepo = tuple.getT2();

                    String widgetName = (String) updatedLayout.getDsl().get("widgetName");
                    assertThat(widgetName).isEqualTo("NewNameTable1");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testRefactorWidgetName_forDefaultWidgetsInList_updatesBothWidgetsAndTemplateReferences() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "testId");
        dsl.put("widgetName", "List1");
        dsl.put("type", "LIST_WIDGET");
        JSONObject template = new JSONObject();
        JSONObject oldWidgetTemplate = new JSONObject();
        oldWidgetTemplate.put("widgetName", "oldWidgetName");
        template.put("oldWidgetName", oldWidgetTemplate);
        dsl.put("template", template);
        final JSONArray children = new JSONArray();
        final JSONObject defaultWidget = new JSONObject();
        defaultWidget.put("widgetId", "testId2");
        defaultWidget.put("widgetName", "oldWidgetName");
        defaultWidget.put("type", "TEXT_WIDGET");
        children.add(defaultWidget);
        dsl.put("children", children);
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        updateLayoutService
                .updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout)
                .block();

        RefactorEntityNameDTO refactorNameDTO = new RefactorEntityNameDTO();
        refactorNameDTO.setEntityType(EntityType.WIDGET);
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("oldWidgetName");
        refactorNameDTO.setNewName("newWidgetName");

        Mono<LayoutDTO> widgetRenameMono = refactoringService.refactorEntityName(refactorNameDTO);

        StepVerifier.create(widgetRenameMono)
                .assertNext(updatedLayout -> {
                    assertTrue(((Map) updatedLayout.getDsl().get("template")).containsKey("newWidgetName"));
                    assertEquals(
                            "newWidgetName",
                            ((Map) (((List) updatedLayout.getDsl().get("children")).get(0))).get("widgetName"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetNameRefactor_withSimpleUpdate_refactorsActionCollectionAndItsAction() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        // Set up table widget in DSL
        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "testId");
        dsl.put("widgetName", "Table1");
        dsl.put("type", "TABLE_WIDGET");
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        updateLayoutService
                .updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout)
                .block();

        // Create an action collection that refers to the table
        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName("testCollection1");
        actionCollectionDTO1.setPageId(testPage.getId());
        actionCollectionDTO1.setApplicationId(testApp.getId());
        actionCollectionDTO1.setWorkspaceId(testApp.getWorkspaceId());
        actionCollectionDTO1.setPluginId(jsDatasource.getPluginId());

        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("\tTable1");
        action1.setDynamicBindingPathList(List.of(new Property("body", null)));
        action1.setPluginType(PluginType.JS);

        actionCollectionDTO1.setActions(List.of(action1));
        actionCollectionDTO1.setBody("export default { x : \tTable1 }");
        actionCollectionDTO1.setActions(List.of(action1));
        actionCollectionDTO1.setPluginType(PluginType.JS);

        final ActionCollectionDTO createdActionCollectionDTO1 =
                layoutCollectionService.createCollection(actionCollectionDTO1).block();

        RefactorEntityNameDTO refactorNameDTO = new RefactorEntityNameDTO();
        refactorNameDTO.setEntityType(EntityType.WIDGET);
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("Table1");
        refactorNameDTO.setNewName("NewNameTable1");

        LayoutDTO updatedLayout =
                refactoringService.refactorEntityName(refactorNameDTO).block();

        assert createdActionCollectionDTO1 != null;
        final Mono<ActionCollection> actionCollectionMono =
                actionCollectionService.getByIdWithoutPermissionCheck(createdActionCollectionDTO1.getId());
        final Mono<NewAction> actionMono = newActionService
                .findByCollectionIdAndViewMode(createdActionCollectionDTO1.getId(), false, null)
                .next();

        StepVerifier.create(Mono.zip(actionCollectionMono, actionMono))
                .assertNext(tuple -> {
                    final ActionCollection actionCollection = tuple.getT1();
                    final NewAction action = tuple.getT2();
                    assertThat(actionCollection.getUnpublishedCollection().getBody())
                            .isEqualTo("export default { x : \tNewNameTable1 }");
                    final ActionDTO unpublishedAction = action.getUnpublishedAction();
                    assertThat(unpublishedAction.getJsonPathKeys()).hasSize(1);
                    final Optional<String> first =
                            unpublishedAction.getJsonPathKeys().stream().findFirst();
                    assert first.isPresent();
                    assertThat(first.get()).isEqualTo("\tNewNameTable1");
                    assertThat(unpublishedAction.getActionConfiguration().getBody())
                            .isEqualTo("\tNewNameTable1");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testRefactorCollection_withModifiedName_ignoresName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        ActionCollectionDTO originalActionCollectionDTO = new ActionCollectionDTO();
        originalActionCollectionDTO.setName("originalName");
        originalActionCollectionDTO.setApplicationId(testApp.getId());
        originalActionCollectionDTO.setWorkspaceId(testApp.getWorkspaceId());
        originalActionCollectionDTO.setPageId(testPage.getId());
        originalActionCollectionDTO.setPluginId(jsDatasource.getPluginId());
        originalActionCollectionDTO.setPluginType(PluginType.JS);
        originalActionCollectionDTO.setBody("export default { x: 1 }");

        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("Table1");

        originalActionCollectionDTO.setActions(List.of(action1));

        final ActionCollectionDTO dto = layoutCollectionService
                .createCollection(originalActionCollectionDTO)
                .block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        assert dto != null;
        actionCollectionDTO.setId(dto.getId());
        actionCollectionDTO.setBody("export default { x: Table1 }");
        actionCollectionDTO.setName("newName");

        RefactorEntityNameDTO refactorActionNameInCollectionDTO = new RefactorEntityNameDTO();
        refactorActionNameInCollectionDTO.setEntityType(EntityType.JS_ACTION);
        refactorActionNameInCollectionDTO.setActionCollection(actionCollectionDTO);
        refactorActionNameInCollectionDTO.setActionId(dto.getActions().get(0).getId());
        refactorActionNameInCollectionDTO.setPageId(testPage.getId());
        refactorActionNameInCollectionDTO.setLayoutId(
                testPage.getLayouts().get(0).getId());
        refactorActionNameInCollectionDTO.setOldName("testAction1");
        refactorActionNameInCollectionDTO.setNewName("newTestAction");
        refactorActionNameInCollectionDTO.setCollectionName("originalName");

        final Mono<Tuple2<ActionCollection, NewAction>> tuple2Mono = refactoringService
                .refactorEntityName(refactorActionNameInCollectionDTO)
                .then(actionCollectionService
                        .getByIdWithoutPermissionCheck(dto.getId())
                        .zipWith(newActionService.findById(
                                dto.getActions().get(0).getId())));

        StepVerifier.create(tuple2Mono)
                .assertNext(tuple -> {
                    final ActionCollectionDTO actionCollectionDTOResult =
                            tuple.getT1().getUnpublishedCollection();
                    final NewAction newAction = tuple.getT2();
                    assertEquals("originalName", actionCollectionDTOResult.getName());
                    assertEquals("export default { x: Table1 }", actionCollectionDTOResult.getBody());
                    assertEquals(
                            "newTestAction", newAction.getUnpublishedAction().getName());
                    assertEquals(
                            "originalName.newTestAction",
                            newAction.getUnpublishedAction().getFullyQualifiedName());
                })
                .verifyComplete();
    }
}
