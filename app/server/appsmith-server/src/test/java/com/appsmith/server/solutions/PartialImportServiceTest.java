package com.appsmith.server.solutions;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Property;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.imports.internal.PartialImportService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.Part;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple3;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class PartialImportServiceTest {

    private static final Map<String, Datasource> datasourceMap = new HashMap<>();
    private static Plugin installedPlugin;
    private static String workspaceId;
    private static String defaultEnvironmentId;
    private static String testAppId;
    private static Datasource jsDatasource;
    private static Plugin installedJsPlugin;
    private static Boolean isSetupDone = false;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private NewPageService newPageService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    WorkspaceService workspaceService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    ThemeRepository themeRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    PagePermission pagePermission;

    @SpyBean
    PluginService pluginService;

    @Autowired
    CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    Gson gson;

    @Autowired
    PartialImportService partialImportService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @BeforeEach
    public void setup() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        if (Boolean.TRUE.equals(isSetupDone)) {
            return;
        }
        User currentUser = sessionUserService.getCurrentUser().block();
        Set<String> beforeCreatingWorkspace =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User before creating workspace: {}", beforeCreatingWorkspace);
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
        Workspace workspace = new Workspace();
        workspace.setName("Import-Export-Test-Workspace");
        Workspace savedWorkspace = workspaceService.create(workspace).block();
        workspaceId = savedWorkspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();
        Set<String> afterCreatingWorkspace =
                cacheableRepositoryHelper.getPermissionGroupsOfUser(currentUser).block();
        log.info("Permission Groups for User after creating workspace: {}", afterCreatingWorkspace);

        log.info("Workspace ID: {}", workspaceId);
        log.info("Workspace Role Ids: {}", workspace.getDefaultPermissionGroups());
        log.info("Policy for created Workspace: {}", workspace.getPolicies());
        log.info("Current User ID: {}", currentUser.getId());

        Application testApplication = new Application();
        testApplication.setName("Export-Application-Test-Application");
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());

        Application savedApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();
        testAppId = savedApplication.getId();

        Datasource ds1 = new Datasource();
        ds1.setName("DS1");
        ds1.setWorkspaceId(workspaceId);
        ds1.setPluginId(installedPlugin.getId());
        final DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://example.org/get");
        datasourceConfiguration.setHeaders(List.of(new Property("X-Answer", "42")));

        HashMap<String, DatasourceStorageDTO> storages1 = new HashMap<>();
        storages1.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        ds1.setDatasourceStorages(storages1);

        Datasource ds2 = new Datasource();
        ds2.setName("DS2");
        ds2.setPluginId(installedPlugin.getId());
        ds2.setWorkspaceId(workspaceId);
        DatasourceConfiguration datasourceConfiguration2 = new DatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setPassword("awesome-password");
        datasourceConfiguration2.setAuthentication(auth);
        HashMap<String, DatasourceStorageDTO> storages2 = new HashMap<>();
        storages2.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration2));
        ds2.setDatasourceStorages(storages2);

        jsDatasource = new Datasource();
        jsDatasource.setName("Default JS datasource");
        jsDatasource.setWorkspaceId(workspaceId);
        installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();
        assert installedJsPlugin != null;
        jsDatasource.setPluginId(installedJsPlugin.getId());

        ds1 = datasourceService.create(ds1).block();
        ds2 = datasourceService.create(ds2).block();
        datasourceMap.put("DS1", ds1);
        datasourceMap.put("DS2", ds2);
        isSetupDone = true;
    }

    private Application createGitConnectedApp(String applicationName) {
        // Create application connected to git
        Application testApplication = new Application();
        testApplication.setName(applicationName);
        testApplication.setWorkspaceId(workspaceId);
        testApplication.setUpdatedAt(Instant.now());
        testApplication.setLastDeployedAt(Instant.now());
        testApplication.setModifiedBy("some-user");
        testApplication.setGitApplicationMetadata(new GitApplicationMetadata());
        GitApplicationMetadata gitData = new GitApplicationMetadata();
        gitData.setBranchName("master");
        gitData.setDefaultBranchName("master");
        testApplication.setGitApplicationMetadata(gitData);

        return applicationPageService
                .createApplication(testApplication, workspaceId)
                .flatMap(application1 -> {
                    application1.getGitApplicationMetadata().setDefaultApplicationId(application1.getId());
                    return applicationService.save(application1);
                })
                .block();
    }

    private FilePart createFilePart(String filePath) {
        FilePart filepart = Mockito.mock(FilePart.class, Mockito.RETURNS_DEEP_STUBS);
        Flux<DataBuffer> dataBufferFlux = DataBufferUtils.read(
                        new ClassPathResource(filePath), new DefaultDataBufferFactory(), 4096)
                .cache();

        Mockito.when(filepart.content()).thenReturn(dataBufferFlux);
        Mockito.when(filepart.headers().getContentType()).thenReturn(MediaType.APPLICATION_JSON);

        return filepart;
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testPartialImport_nonGitConnectedApp_success() {

        // Create an application with all resources
        Application testApplication = new Application();
        testApplication.setName("testPartialImport_nonGitConnectedApp_success");
        testApplication.setWorkspaceId(workspaceId);

        testApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        String pageId = newPageService
                .findById(testApplication.getPages().get(0).getId(), Optional.empty())
                .block()
                .getId();

        Part filePart = createFilePart("test_assets/ImportExportServiceTest/partial-export-resource.json");

        Mono<Tuple3<Application, List<NewAction>, List<ActionCollection>>> result = partialImportService
                .importResourceInPage(workspaceId, testApplication.getId(), pageId, null, filePart)
                .flatMap(application -> {
                    Mono<List<NewAction>> actionList = newActionService
                            .findByPageId(pageId, Optional.empty())
                            .collectList();
                    Mono<List<ActionCollection>> actionCollectionList =
                            actionCollectionService.findByPageId(pageId).collectList();

                    return Mono.zip(Mono.just(application), actionList, actionCollectionList);
                });

        StepVerifier.create(result)
                .assertNext(object -> {
                    Application application = object.getT1();
                    List<NewAction> actionList = object.getT2();
                    List<ActionCollection> actionCollectionList = object.getT3();

                    // Verify that the application has the imported resource
                    assertThat(application.getPages().size()).isEqualTo(1);

                    assertThat(actionCollectionList.size()).isEqualTo(1);
                    assertThat(actionCollectionList
                                    .get(0)
                                    .getUnpublishedCollection()
                                    .getName())
                            .isEqualTo("utils");
                    assertThat(actionList.size()).isEqualTo(4);
                    Set<String> actionNames = Set.of("DeleteQuery", "UpdateQuery", "SelectQuery", "InsertQuery");
                    actionList.forEach(action -> {
                        assertThat(actionNames.contains(
                                        action.getUnpublishedAction().getName()))
                                .isTrue();
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testPartialImport_gitConnectedAppDefaultBranch_success() {
        Application application = createGitConnectedApp("testPartialImport_gitConnectedAppDefaultBranch_success");

        // update git branch name for page
        PageDTO savedPage = new PageDTO();
        savedPage.setName("Page 2");
        savedPage.setApplicationId(application.getId());
        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setApplicationId(application.getId());
        defaultResources.setBranchName("master");
        savedPage.setDefaultResources(defaultResources);
        savedPage = applicationPageService
                .createPageWithBranchName(savedPage, "master")
                .block();

        Part filePart = createFilePart("test_assets/ImportExportServiceTest/partial-export-valid-without-widget.json");

        PageDTO finalSavedPage = savedPage;
        Mono<Tuple3<Application, List<NewAction>, List<ActionCollection>>> result = partialImportService
                .importResourceInPage(workspaceId, application.getId(), savedPage.getId(), "master", filePart)
                .flatMap(application1 -> {
                    Mono<List<NewAction>> actionList = newActionService
                            .findByPageId(finalSavedPage.getId(), Optional.empty())
                            .collectList();
                    Mono<List<ActionCollection>> actionCollectionList = actionCollectionService
                            .findByPageId(finalSavedPage.getId())
                            .collectList();
                    return Mono.zip(Mono.just(application1), actionList, actionCollectionList);
                });

        StepVerifier.create(result)
                .assertNext(object -> {
                    Application application1 = object.getT1();
                    List<NewAction> actionList = object.getT2();
                    List<ActionCollection> actionCollectionList = object.getT3();

                    // Verify that the application has the imported resource
                    assertThat(application1.getPages().size()).isEqualTo(2);

                    assertThat(application1.getUnpublishedCustomJSLibs().size()).isEqualTo(1);

                    assertThat(actionCollectionList.size()).isEqualTo(1);
                    assertThat(actionCollectionList
                                    .get(0)
                                    .getUnpublishedCollection()
                                    .getName())
                            .isEqualTo("Github_Transformer");
                    assertThat(actionList.size()).isEqualTo(1);
                    Set<String> actionNames = Set.of("get_force_roster");
                    actionList.forEach(action -> {
                        assertThat(actionNames.contains(
                                        action.getUnpublishedAction().getName()))
                                .isTrue();
                    });
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testPartialImport_nameClashInAction_successWithNoNameDuplicates() {

        // Create an application with all resources
        Application testApplication = new Application();
        testApplication.setName("testPartialImport_nameClashInAction_successWithNoNameDuplicates");
        testApplication.setWorkspaceId(workspaceId);

        testApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        String pageId = newPageService
                .findById(testApplication.getPages().get(0).getId(), Optional.empty())
                .block()
                .getId();

        Part filePart = createFilePart("test_assets/ImportExportServiceTest/partial-export-resource.json");

        Mono<Tuple3<Application, List<NewAction>, List<ActionCollection>>> result = partialImportService
                .importResourceInPage(workspaceId, testApplication.getId(), pageId, null, filePart)
                .then(partialImportService.importResourceInPage(
                        workspaceId, testApplication.getId(), pageId, null, filePart))
                .flatMap(application -> {
                    Mono<List<NewAction>> actionList = newActionService
                            .findByPageId(pageId, Optional.empty())
                            .collectList();
                    Mono<List<ActionCollection>> actionCollectionList =
                            actionCollectionService.findByPageId(pageId).collectList();

                    return Mono.zip(Mono.just(application), actionList, actionCollectionList);
                });

        StepVerifier.create(result)
                .assertNext(object -> {
                    Application application = object.getT1();
                    List<NewAction> actionList = object.getT2();
                    List<ActionCollection> actionCollectionList = object.getT3();

                    // Verify that the application has the imported resource
                    assertThat(application.getPages().size()).isEqualTo(1);

                    assertThat(actionCollectionList.size()).isEqualTo(2);
                    Set<String> nameList = Set.of("utils", "utils1");
                    actionCollectionList.forEach(collection -> {
                        assertThat(nameList.contains(
                                        collection.getUnpublishedCollection().getName()))
                                .isTrue();
                    });
                    assertThat(actionList.size()).isEqualTo(8);
                    Set<String> actionNames = Set.of(
                            "DeleteQuery",
                            "UpdateQuery",
                            "SelectQuery",
                            "InsertQuery",
                            "DeleteQuery1",
                            "UpdateQuery1",
                            "SelectQuery1",
                            "InsertQuery1");
                    actionList.forEach(action -> {
                        assertThat(actionNames.contains(
                                        action.getUnpublishedAction().getName()))
                                .isTrue();
                    });
                })
                .verifyComplete();
    }
}
