package com.appsmith.server.solutions;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Property;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PartialExportFileDTO;
import com.appsmith.server.exports.internal.partial.PartialExportService;
import com.appsmith.server.extensions.AfterAllCleanUpExtension;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.cakes.ApplicationRepositoryCake;
import com.appsmith.server.repositories.cakes.PermissionGroupRepositoryCake;
import com.appsmith.server.repositories.cakes.PluginRepositoryCake;
import com.appsmith.server.repositories.cakes.ThemeRepositoryCake;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.WorkspaceService;
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
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@ExtendWith(AfterAllCleanUpExtension.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
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
    PluginRepositoryCake pluginRepository;

    @Autowired
    ApplicationRepositoryCake applicationRepository;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    WorkspaceService workspaceService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    ThemeRepositoryCake themeRepository;

    @Autowired
    PermissionGroupRepositoryCake permissionGroupRepository;

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
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();
        Workspace workspace = new Workspace();
        workspace.setName("Import-Export-Test-Workspace");
        Workspace savedWorkspace = workspaceService.create(workspace).block();
        workspaceId = savedWorkspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

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
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());

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
        testApplication.setGitApplicationMetadata(new GitArtifactMetadata());
        GitArtifactMetadata gitData = new GitArtifactMetadata();
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
        Mockito.when(pluginService.findAllByIdsWithoutPermission(Mockito.anySet(), Mockito.anyList()))
                .thenReturn(Flux.fromIterable(List.of(installedPlugin, installedJsPlugin)));

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
                testApplication.getId(), savedPage.getId(), partialExportFileDTO);

        StepVerifier.create(partialExportFileDTOMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getDatasourceList()).hasSize(2);
                    List<String> dsNames = applicationJson.getDatasourceList().stream()
                            .map(DatasourceStorage::getName)
                            .toList();
                    assertThat(dsNames).containsAll(List.of("DS1", "DS2"));
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
        Mockito.when(pluginService.findAllByIdsWithoutPermission(Mockito.anySet(), Mockito.anyList()))
                .thenReturn(Flux.fromIterable(List.of(installedPlugin, installedJsPlugin)));

        Application application = createGitConnectedApp("testGetPartialExport_gitConnectedApp_branchResourceExported");

        // update git branch name for page
        PageDTO savedPage = new PageDTO();
        savedPage.setName("Page 2");
        savedPage.setApplicationId(application.getId());
        savedPage.setBranchName("master");
        savedPage = applicationPageService.createPage(savedPage).block();

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
                application.getId(), savedPage.getId(), partialExportFileDTO);

        StepVerifier.create(partialExportFileDTOMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getDatasourceList()).hasSize(2);
                    List<String> dsNames = applicationJson.getDatasourceList().stream()
                            .map(DatasourceStorage::getName)
                            .toList();
                    assertThat(dsNames).containsAll(List.of("DS1", "DS2"));
                    assertThat(applicationJson.getDatasourceList().get(0).getPluginId())
                            .isEqualTo("installed-plugin");
                    assertThat(applicationJson.getDatasourceList().get(1).getPluginId())
                            .isEqualTo("installed-plugin");
                    assertThat(applicationJson.getActionList()).hasSize(1);

                    NewAction newAction = applicationJson.getActionList().get(0);
                    assertThat(newAction.getUnpublishedAction().getName()).isEqualTo("validAction");
                    assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo("Page 2");
                    assertThat(newAction.getId()).isEqualTo("Page 2_validAction");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetPartialExport_gitConnectedApp_featureBranchResourceExported() {
        Mockito.when(pluginService.findAllByIdsWithoutPermission(Mockito.anySet(), Mockito.anyList()))
                .thenReturn(Flux.fromIterable(List.of(installedPlugin, installedJsPlugin)));

        Application application =
                createGitConnectedApp("testGetPartialExport_gitConnectedApp_featureBranchResourceExported");

        // update git branch name for page
        PageDTO savedPage = new PageDTO();
        savedPage.setName("Page 2");
        savedPage.setApplicationId(application.getId());
        savedPage.setBranchName("master");
        savedPage = applicationPageService.createPage(savedPage).block();

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
        action.setBranchName("master");

        ActionDTO savedAction =
                layoutActionService.createSingleAction(action, Boolean.FALSE).block();

        PartialExportFileDTO partialExportFileDTO = new PartialExportFileDTO();
        partialExportFileDTO.setDatasourceList(List.of(
                datasourceMap.get("DS1").getId(), datasourceMap.get("DS2").getId()));
        // For a feature branch the resources in the client always get the default resource id
        partialExportFileDTO.setActionList(List.of(savedAction.getId()));

        // Get the partial export resources
        Mono<ApplicationJson> partialExportFileDTOMono = partialExportService.getPartialExportResources(
                application.getId(), savedPage.getId(), partialExportFileDTO);

        StepVerifier.create(partialExportFileDTOMono)
                .assertNext(applicationJson -> {
                    assertThat(applicationJson.getDatasourceList()).hasSize(2);
                    List<String> dsNames = applicationJson.getDatasourceList().stream()
                            .map(DatasourceStorage::getName)
                            .toList();
                    assertThat(dsNames).containsAll(List.of("DS1", "DS2"));
                    assertThat(applicationJson.getDatasourceList().get(0).getPluginId())
                            .isEqualTo("installed-plugin");
                    assertThat(applicationJson.getDatasourceList().get(1).getPluginId())
                            .isEqualTo("installed-plugin");
                    assertThat(applicationJson.getActionList()).hasSize(1);

                    NewAction newAction = applicationJson.getActionList().get(0);
                    assertThat(newAction.getUnpublishedAction().getName()).isEqualTo("validAction");
                    assertThat(newAction.getUnpublishedAction().getPageId()).isEqualTo("Page 2");
                    assertThat(newAction.getId()).isEqualTo("Page 2_validAction");
                })
                .verifyComplete();
    }
}
