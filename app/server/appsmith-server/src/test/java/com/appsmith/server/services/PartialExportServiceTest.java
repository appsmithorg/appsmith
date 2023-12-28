package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Property;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PartialExportFileDTO;
import com.appsmith.server.exports.internal.PartialExportService;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.solutions.PagePermission;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class PartialExportServiceTest {

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
    private LayoutActionService layoutActionService;

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    @Autowired
    private SessionUserService sessionUserService;

    @Autowired
    private PartialExportService partialExportService;

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

        Mockito.when(pluginService.findAllByIdsWithoutPermission(Mockito.any(), Mockito.anyList()))
                .thenReturn(Flux.fromIterable(List.of(installedPlugin, installedJsPlugin)));
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

    @Test
    @WithUserDetails(value = "api_user")
    void testGetPartialExport_nonGitConnectedApp_success() {
        // Create an application with all resources
        Application testApplication = new Application();
        testApplication.setName("testGetPartialExport_nonGitConnectedApp_success");
        testApplication.setWorkspaceId(workspaceId);

        testApplication = applicationPageService
                .createApplication(testApplication, workspaceId)
                .block();

        // Create pages
        PageDTO page = new PageDTO();
        page.setName("Page 2");
        page.setApplicationId(testApplication.getId());
        PageDTO savedPage = applicationPageService.createPage(page).block();

        PartialExportFileDTO partialExportFileDTO = new PartialExportFileDTO();
        partialExportFileDTO.setDatasourceList(List.of(
                datasourceMap.get("DS1").getId(), datasourceMap.get("DS2").getId()));

        // Get the partial export resources
        Mono<ApplicationJson> partialExportFileDTOMono = partialExportService.getPartialExportResources(
                testApplication.getId(), savedPage.getId(), null, partialExportFileDTO);

        StepVerifier.create(partialExportFileDTOMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getDatasourceList().size()).isEqualTo(2);
                    assertThat(applicationJson.getDatasourceList().get(0).getName())
                            .isEqualTo("DS1");
                    assertThat(applicationJson.getDatasourceList().get(1).getName())
                            .isEqualTo("DS2");
                    assertThat(applicationJson.getDatasourceList().get(0).getPluginId())
                            .isEqualTo("installed-plugin");
                    assertThat(applicationJson.getDatasourceList().get(1).getPluginId())
                            .isEqualTo("installed-plugin");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetPartialExport_gitConnectedApp_branchResourceExported() {
        Application application = createGitConnectedApp("testGetPartialExport_gitConnectedApp_branchResourceExported");

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

        // Create Action
        ActionDTO action = new ActionDTO();
        action.setName("validAction");
        action.setPageId(savedPage.getId());
        action.setExecuteOnLoad(true);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionConfiguration.setTimeoutInMillisecond("6000");
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasourceMap.get("DS1"));

        ActionDTO savedAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        PartialExportFileDTO partialExportFileDTO = new PartialExportFileDTO();
        partialExportFileDTO.setDatasourceList(List.of(
                datasourceMap.get("DS1").getId(), datasourceMap.get("DS2").getId()));
        partialExportFileDTO.setActionList(List.of(savedAction.getId()));

        // Get the partial export resources
        Mono<ApplicationJson> partialExportFileDTOMono = partialExportService.getPartialExportResources(
                application.getId(), savedPage.getId(), "master", partialExportFileDTO);

        StepVerifier.create(partialExportFileDTOMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getDatasourceList().size()).isEqualTo(2);
                    assertThat(applicationJson.getDatasourceList().get(0).getName())
                            .isEqualTo("DS1");
                    assertThat(applicationJson.getDatasourceList().get(1).getName())
                            .isEqualTo("DS2");
                    assertThat(applicationJson.getDatasourceList().get(0).getPluginId())
                            .isEqualTo("installed-plugin");
                    assertThat(applicationJson.getDatasourceList().get(1).getPluginId())
                            .isEqualTo("installed-plugin");
                    assertThat(applicationJson.getActionList().size()).isEqualTo(1);
                    assertThat(applicationJson
                                    .getActionList()
                                    .get(0)
                                    .getUnpublishedAction()
                                    .getName())
                            .isEqualTo("validAction");
                    assertThat(applicationJson
                                    .getActionList()
                                    .get(0)
                                    .getUnpublishedAction()
                                    .getPageId())
                            .isEqualTo("Page 2");
                    assertThat(applicationJson.getActionList().get(0).getId()).isEqualTo("Page 2_validAction");
                })
                .verifyComplete();
    }
}
