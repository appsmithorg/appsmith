package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.dtos.RefactorActionNameInCollectionDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.RefactoringSolution;
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
import org.springframework.test.context.junit.jupiter.SpringExtension;
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
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
class RefactoringSolutionCETest {

    @SpyBean
    NewActionService newActionService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    PluginRepository pluginRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    RefactoringSolution refactoringSolution;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionRepository actionRepository;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    Application testApp = null;

    PageDTO testPage = null;

    Application gitConnectedApp = null;

    PageDTO gitConnectedPage = null;

    Datasource datasource;

    String workspaceId;

    String branchName;

    Datasource jsDatasource;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {
        newPageService.deleteAll();
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("LayoutActionServiceTest");

        Workspace workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();

        if (testApp == null && testPage == null) {
            //Create application and page which will be used by the tests to create actions for.
            Application application = new Application();
            application.setName(UUID.randomUUID().toString());
            testApp = applicationPageService.createApplication(application, workspace.getId()).block();

            final String pageId = testApp.getPages().get(0).getId();

            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();

            Layout layout = testPage.getLayouts().get(0);
            JSONObject dsl = new JSONObject();
            dsl.put("widgetName", "firstWidget");
            JSONArray temp = new JSONArray();
            temp.addAll(List.of(new JSONObject(Map.of("key", "testField")),
                    new JSONObject(Map.of("key", "testField2"))));
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
            temp2.addAll(List.of(new JSONObject(Map.of("key", "primaryColumns._id"))));
            dsl2.put("dynamicBindingPathList", temp2);
            objects.add(dsl2);
            dsl.put("children", objects);

            layout.setDsl(dsl);
            layout.setPublishedDsl(dsl);
            layoutActionService.updateLayout(pageId, testApp.getId(), layout.getId(), layout).block();

            testPage = newPageService.findPageById(pageId, READ_PAGES, false).block();
        }

        if (gitConnectedApp == null) {
            Application newApp = new Application();
            newApp.setName(UUID.randomUUID().toString());
            GitApplicationMetadata gitData = new GitApplicationMetadata();
            gitData.setBranchName("actionServiceTest");
            newApp.setGitApplicationMetadata(gitData);
            gitConnectedApp = applicationPageService.createApplication(newApp, workspaceId)
                    .flatMap(application -> {
                        application.getGitApplicationMetadata().setDefaultApplicationId(application.getId());
                        return applicationService.save(application)
                                .zipWhen(application1 -> importExportApplicationService.exportApplicationById(application1.getId(), gitData.getBranchName()));
                    })
                    // Assign the branchName to all the resources connected to the application
                    .flatMap(tuple -> importExportApplicationService.importApplicationInWorkspace(workspaceId, tuple.getT2(), tuple.getT1().getId(), gitData.getBranchName()))
                    .block();

            gitConnectedPage = newPageService.findPageById(gitConnectedApp.getPages().get(0).getId(), READ_PAGES, false).block();

            branchName = gitConnectedApp.getGitApplicationMetadata().getBranchName();
        }

        workspaceId = workspace.getId();
        datasource = new Datasource();
        datasource.setName("Default Database");
        datasource.setWorkspaceId(workspaceId);
        Plugin installed_plugin = pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS Database");
        jsDatasource.setWorkspaceId(workspaceId);
        Plugin installedJsPlugin = pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        jsDatasource.setPluginId(installedJsPlugin.getId());
    }

    @AfterEach
    @WithUserDetails(value = "api_user")
    public void cleanup() {
        applicationPageService.deleteApplication(testApp.getId()).block();
        testApp = null;
        testPage = null;
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void refactorActionName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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
        temp.addAll(List.of(new JSONObject(Map.of("key", "innerArrayReference[0].innerK")),
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

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();


        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("beforeNameChange");
        refactorActionNameDTO.setNewName("PostNameChange");
        refactorActionNameDTO.setActionId(createdAction.getId());

        LayoutDTO postNameChangeLayout = refactoringSolution.refactorActionName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(createdAction.getId(), READ_ACTIONS);

        StepVerifier
                .create(postNameChangeActionMono)
                .assertNext(updatedAction -> {

                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("PostNameChange");

                    DslActionDTO actionDTO = postNameChangeLayout.getLayoutOnLoadActions().get(0).iterator().next();
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
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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
        temp.addAll(List.of(new JSONObject(Map.of("key", "innerArrayReference[0].innerK")),
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

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(gitConnectedPage.getId(), testApp.getId(), layout.getId(), layout, branchName).block();


        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(gitConnectedPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("beforeNameChange");
        refactorActionNameDTO.setNewName("PostNameChange");
        refactorActionNameDTO.setActionId(createdAction.getId());

        LayoutDTO postNameChangeLayout = refactoringSolution.refactorActionName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(createdAction.getId(), READ_ACTIONS);

        StepVerifier
                .create(postNameChangeActionMono)
                .assertNext(updatedAction -> {

                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("PostNameChange");

                    DslActionDTO actionDTO = postNameChangeLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("PostNameChange");

                    dsl.put("testField", "{{ \tPostNameChange.data }}");
                    innerObjectReference.put("k", "{{\tPostNameChange.data}}");
                    innerArrayReference.clear();
                    innerArrayReference.add(new JSONObject(Map.of("innerK", "{{\tPostNameChange.data}}")));
                    assertThat(postNameChangeLayout.getDsl()).isEqualTo(dsl);
                    assertThat(updatedAction.getDefaultResources()).isNotNull();
                    assertThat(updatedAction.getDefaultResources().getActionId()).isEqualTo(updatedAction.getId());
                    assertThat(updatedAction.getDefaultResources().getApplicationId()).isEqualTo(gitConnectedApp.getId());
                    assertThat(updatedAction.getUnpublishedAction().getDefaultResources().getPageId()).isEqualTo(gitConnectedPage.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void refactorActionNameToDeletedName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        ActionDTO action = new ActionDTO();
        action.setName("Query1");
        action.setPageId(testPage.getId());
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        Layout layout = testPage.getLayouts().get(0);

        ActionDTO firstAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        layout.setDsl(layoutActionService.unescapeMongoSpecialCharacters(layout));
        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();

        applicationPageService.publish(testPage.getApplicationId(), true).block();

        newActionService.deleteUnpublishedAction(firstAction.getId()).block();

        // Create another action with the same name as the erstwhile deleted action
        action.setId(null);
        ActionDTO secondAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("Query1");
        refactorActionNameDTO.setNewName("NewActionName");
        refactorActionNameDTO.setActionId(firstAction.getId());

        refactoringSolution.refactorActionName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(secondAction.getId(), READ_ACTIONS);

        StepVerifier
                .create(postNameChangeActionMono)
                .assertNext(updatedAction -> {

                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("NewActionName");

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testRefactorActionName_withInvalidName_throwsError() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ beforeNameChange.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO createdAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();

        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(testPage.getId());
        assert firstLayout != null;
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("beforeNameChange");
        refactorActionNameDTO.setNewName("!PostNameChange");
        assert createdAction != null;
        refactorActionNameDTO.setActionId(createdAction.getId());

        final Mono<LayoutDTO> layoutDTOMono = refactoringSolution.refactorActionName(refactorActionNameDTO);

        StepVerifier
                .create(layoutDTOMono)
                .expectErrorMatches(e -> e instanceof AppsmithException &&
                        AppsmithError.INVALID_ACTION_NAME.getMessage().equalsIgnoreCase(e.getMessage()))
                .verify();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void refactorDuplicateActionName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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
        temp.addAll(List.of(new JSONObject(Map.of("key", "testField"))));
        dsl.put("dynamicBindingPathList", temp);
        dsl.put("testField", "{{ duplicateName.data }}");

        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);
        layout.setPublishedDsl(dsl);

        ActionDTO firstAction = layoutActionService.createSingleAction(action, Boolean.FALSE).block();

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
        duplicateNameCompleteAction.setTemplateId(duplicateName.getTemplateId());
        duplicateNameCompleteAction.setProviderId(duplicateName.getProviderId());
        duplicateNameCompleteAction.setDocumentation(duplicateName.getDocumentation());
        duplicateNameCompleteAction.setApplicationId(duplicateName.getApplicationId());

        // Now save this action directly in the repo to create a duplicate action name scenario
        actionRepository.save(duplicateNameCompleteAction).block();

        LayoutDTO firstLayout = layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();

        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO();
        refactorActionNameDTO.setPageId(testPage.getId());
        refactorActionNameDTO.setLayoutId(firstLayout.getId());
        refactorActionNameDTO.setOldName("duplicateName");
        refactorActionNameDTO.setNewName("newName");
        refactorActionNameDTO.setActionId(firstAction.getId());

        LayoutDTO postNameChangeLayout = refactoringSolution.refactorActionName(refactorActionNameDTO).block();

        Mono<NewAction> postNameChangeActionMono = newActionService.findById(firstAction.getId(), READ_ACTIONS);

        StepVerifier
                .create(postNameChangeActionMono)
                .assertNext(updatedAction -> {

                    assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo("newName");

                    DslActionDTO actionDTO = postNameChangeLayout.getLayoutOnLoadActions().get(0).iterator().next();
                    assertThat(actionDTO.getName()).isEqualTo("newName");

                    dsl.put("testField", "{{ newName.data }}");
                    assertThat(postNameChangeLayout.getDsl()).isEqualTo(dsl);
                })
                .verifyComplete();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void tableWidgetKeyEscapeRefactorName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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

        layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();

        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("Table1");
        refactorNameDTO.setNewName("NewNameTable1");

        Mono<LayoutDTO> widgetRenameMono = refactoringSolution.refactorWidgetName(refactorNameDTO).cache();

        Mono<PageDTO> pageFromRepoMono = widgetRenameMono.then(newPageService.findPageById(testPage.getId(), READ_PAGES, false));

        StepVerifier
                .create(Mono.zip(widgetRenameMono, pageFromRepoMono))
                .assertNext(tuple -> {
                    LayoutDTO updatedLayout = tuple.getT1();
                    PageDTO pageFromRepo = tuple.getT2();

                    String widgetName = (String) updatedLayout.getDsl().get("widgetName");
                    assertThat(widgetName).isEqualTo("NewNameTable1");

                    Map primaryColumns1 = (Map) updatedLayout.getDsl().get("primaryColumns");
                    assertThat(primaryColumns1.keySet()).containsAll(Set.of(FieldName.MONGO_UNESCAPED_ID, FieldName.MONGO_UNESCAPED_CLASS));

                    Map primaryColumns2 = (Map) pageFromRepo.getLayouts().get(0).getDsl().get("primaryColumns");
                    assertThat(primaryColumns2.keySet()).containsAll(Set.of(FieldName.MONGO_ESCAPE_ID, FieldName.MONGO_ESCAPE_CLASS));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void simpleWidgetNameRefactor() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "simpleRefactorId");
        dsl.put("widgetName", "Table1");
        dsl.put("type", "TABLE_WIDGET");
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();

        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("Table1");
        refactorNameDTO.setNewName("NewNameTable1");

        Mono<LayoutDTO> widgetRenameMono = refactoringSolution.refactorWidgetName(refactorNameDTO).cache();

        Mono<PageDTO> pageFromRepoMono = widgetRenameMono.then(newPageService.findPageById(testPage.getId(), READ_PAGES, false));

        StepVerifier
                .create(Mono.zip(widgetRenameMono, pageFromRepoMono))
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
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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

        layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();

        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("oldWidgetName");
        refactorNameDTO.setNewName("newWidgetName");

        Mono<LayoutDTO> widgetRenameMono = refactoringSolution.refactorWidgetName(refactorNameDTO);

        StepVerifier
                .create(widgetRenameMono)
                .assertNext(updatedLayout -> {
                    assertTrue(((Map) updatedLayout.getDsl().get("template")).containsKey("newWidgetName"));
                    assertEquals("newWidgetName",
                            ((Map) (((List) updatedLayout.getDsl().get("children")).get(0))).get("widgetName"));
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testWidgetNameRefactor_withSimpleUpdate_refactorsActionCollectionAndItsAction() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        // Set up table widget in DSL
        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "testId");
        dsl.put("widgetName", "Table1");
        dsl.put("type", "TABLE_WIDGET");
        Layout layout = testPage.getLayouts().get(0);
        layout.setDsl(dsl);

        layoutActionService.updateLayout(testPage.getId(), testApp.getId(), layout.getId(), layout).block();

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

        final ActionCollectionDTO createdActionCollectionDTO1 = layoutCollectionService.createCollection(actionCollectionDTO1).block();

        RefactorNameDTO refactorNameDTO = new RefactorNameDTO();
        refactorNameDTO.setPageId(testPage.getId());
        refactorNameDTO.setLayoutId(layout.getId());
        refactorNameDTO.setOldName("Table1");
        refactorNameDTO.setNewName("NewNameTable1");

        LayoutDTO updatedLayout = refactoringSolution.refactorWidgetName(refactorNameDTO).block();

        assert createdActionCollectionDTO1 != null;
        final Mono<ActionCollection> actionCollectionMono = actionCollectionService.getById(createdActionCollectionDTO1.getId());
        final Optional<String> optional = createdActionCollectionDTO1.getDefaultToBranchedActionIdsMap().values().stream().findFirst();
        assert optional.isPresent();
        final Mono<NewAction> actionMono = newActionService.findById(optional.get());

        StepVerifier
                .create(Mono.zip(actionCollectionMono, actionMono))
                .assertNext(tuple -> {
                    final ActionCollection actionCollection = tuple.getT1();
                    final NewAction action = tuple.getT2();
                    assertThat(actionCollection.getUnpublishedCollection().getBody()).isEqualTo("export default { x : \tNewNameTable1 }");
                    final ActionDTO unpublishedAction = action.getUnpublishedAction();
                    assertThat(unpublishedAction.getJsonPathKeys().size()).isEqualTo(1);
                    final Optional<String> first = unpublishedAction.getJsonPathKeys().stream().findFirst();
                    assert first.isPresent();
                    assertThat(first.get()).isEqualTo("\tNewNameTable1");
                    assertThat(unpublishedAction.getActionConfiguration().getBody()).isEqualTo("\tNewNameTable1");
                })
                .verifyComplete();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void testRefactorCollection_withModifiedName_ignoresName() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

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

        final ActionCollectionDTO dto = layoutCollectionService.createCollection(originalActionCollectionDTO).block();

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        assert dto != null;
        actionCollectionDTO.setId(dto.getId());
        actionCollectionDTO.setBody("export default { x: Table1 }");
        actionCollectionDTO.setName("newName");

        RefactorActionNameInCollectionDTO refactorActionNameInCollectionDTO = new RefactorActionNameInCollectionDTO();
        refactorActionNameInCollectionDTO.setActionCollection(actionCollectionDTO);
        RefactorActionNameDTO refactorActionNameDTO = new RefactorActionNameDTO(
                dto.getActions().get(0).getId(),
                testPage.getId(),
                testPage.getLayouts().get(0).getId(),
                "testAction1",
                "newTestAction",
                "originalName"
        );
        refactorActionNameInCollectionDTO.setRefactorAction(refactorActionNameDTO);

        final Mono<Tuple2<ActionCollection, NewAction>> tuple2Mono = layoutCollectionService
                .refactorAction(refactorActionNameInCollectionDTO)
                .then(actionCollectionService.getById(dto.getId())
                        .zipWith(newActionService.findById(dto.getActions().get(0).getId())));

        StepVerifier.create(tuple2Mono)
                .assertNext(tuple -> {
                    final ActionCollectionDTO actionCollectionDTOResult = tuple.getT1().getUnpublishedCollection();
                    final NewAction newAction = tuple.getT2();
                    assertEquals("originalName", actionCollectionDTOResult.getName());
                    assertEquals("export default { x: Table1 }", actionCollectionDTOResult.getBody());
                    assertEquals("newTestAction", newAction.getUnpublishedAction().getName());
                    assertEquals("originalName.newTestAction", newAction.getUnpublishedAction().getFullyQualifiedName());
                })
                .verifyComplete();

    }


}