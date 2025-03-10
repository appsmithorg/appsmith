package com.appsmith.server.refactors.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.constants.ArtifactType.APPLICATION;

@SpringBootTest
@Slf4j
public class RefactoringServiceTest {

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
    UpdateLayoutService updateLayoutService;

    @Autowired
    RefactoringService refactoringService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @SpyBean
    NewPageService newPageService;

    @Autowired
    NewActionRepository actionRepository;

    @SpyBean
    ActionCollectionService actionCollectionService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ImportService importService;

    @Autowired
    ExportService exportService;

    @Autowired
    ApplicationPermission applicationPermission;

    Application testApp = null;

    PageDTO testPage = null;

    Application gitConnectedApp = null;

    PageDTO gitConnectedPage = null;

    Datasource datasource;

    String workspaceId;

    String branchName;

    Datasource jsDatasource;

    Plugin installed_plugin;

    Plugin installedJsPlugin;

    @BeforeEach
    public void setup() {
        newPageService.deleteAll().block();
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("LayoutActionServiceTest");

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
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
                    return applicationService
                            .save(application1)
                            .zipWhen(application11 -> exportService.exportByArtifactIdAndBranchName(
                                    application11.getId(), gitData.getRefName(), APPLICATION));
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
        installed_plugin =
                pluginRepository.findByPackageName("installed-plugin").block();
        datasource.setPluginId(installed_plugin.getId());

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS Database");
        jsDatasource.setWorkspaceId(workspaceId);
        installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        jsDatasource.setPluginId(installedJsPlugin.getId());
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspaceId, permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testIsNameAllowed_withRepeatedActionCollectionName_throwsError() {
        Mockito.doReturn(Flux.empty()).when(newActionService).getUnpublishedActions(Mockito.any());

        ActionCollectionDTO mockActionCollectionDTO = new ActionCollectionDTO();
        mockActionCollectionDTO.setName("testCollection");

        Mockito.doReturn(Flux.just(mockActionCollectionDTO))
                .when(actionCollectionService)
                .getCollectionsByPageIdAndViewMode(Mockito.any(), Mockito.anyBoolean(), Mockito.any());

        Mono<Boolean> nameAllowedMono = refactoringService.isNameAllowed(
                testPage.getId(),
                CreatorContextType.PAGE,
                testPage.getLayouts().get(0).getId(),
                "testCollection");

        StepVerifier.create(nameAllowedMono).assertNext(Assertions::assertFalse).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void jsActionWithoutCollectionIdShouldBeIgnoredDuringNameChecking() {
        ActionDTO firstAction = new ActionDTO();
        firstAction.setPluginType(PluginType.JS);
        firstAction.setName("foo");
        firstAction.setFullyQualifiedName("testCollection.foo");
        firstAction.setCollectionId("collectionId");

        ActionDTO secondAction = new ActionDTO();
        secondAction.setPluginType(PluginType.JS);
        secondAction.setName("bar");
        secondAction.setFullyQualifiedName("testCollection.bar");
        secondAction.setCollectionId(null);

        Mockito.doReturn(Flux.just(firstAction, secondAction))
                .when(newActionService)
                .getUnpublishedActions(Mockito.any());

        ActionCollectionDTO mockActionCollectionDTO = new ActionCollectionDTO();
        mockActionCollectionDTO.setName("testCollection");
        mockActionCollectionDTO.setActions(List.of(firstAction, secondAction));

        Mockito.when(actionCollectionService.getNonComposedActionCollectionsByViewMode(
                        Mockito.any(), Mockito.anyBoolean()))
                .thenReturn(Flux.just(mockActionCollectionDTO));

        Mono<Boolean> nameAllowedMono = refactoringService.isNameAllowed(
                testPage.getId(),
                CreatorContextType.PAGE,
                testPage.getLayouts().get(0).getId(),
                "testCollection.bar");

        StepVerifier.create(nameAllowedMono).assertNext(Assertions::assertTrue).verifyComplete();
    }
}
