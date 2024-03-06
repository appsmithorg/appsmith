package com.appsmith.server.services.ee;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.EnvironmentPermission;
import com.appsmith.server.workflows.crud.CrudWorkflowEntityService;
import com.appsmith.server.workflows.crud.CrudWorkflowService;
import lombok.extern.slf4j.Slf4j;
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
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.models.CreatorContextType.WORKFLOW;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class ActionCollectionServiceTest {
    @Autowired
    DatasourceService datasourceService;

    @SpyBean
    DatasourceService spyDatasourceService;

    @SpyBean
    DatasourceStorageService datasourceStorageService;

    @Autowired
    PluginService pluginService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    EncryptionService encryptionService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    UserService userService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    NewActionRepository newActionRepository;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    CrudWorkflowService crudWorkflowService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    CrudWorkflowEntityService crudWorkflowEntityService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    Workspace workspace;
    Workflow workflow;
    Datasource datasource;
    Application application;
    Plugin plugin;

    @BeforeEach
    public void setup() {
        String testClassName = "NewActionServiceTest";
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_workflows_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(
                FeatureFlagEnum.license_gac_enabled.name(), TRUE,
                FeatureFlagEnum.release_workflows_enabled.name(), TRUE));
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace - " + testClassName);

        workspace = workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        String defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Application toCreateApplication = new Application();
        toCreateApplication.setName("Application - " + testClassName);
        application = applicationPageService
                .createApplication(toCreateApplication, workspace.getId())
                .block();

        workflow = createWorkflow("Workflow - " + testClassName, workspace.getId());

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("Datasource - " + testClassName);
        externalDatasource.setWorkspaceId(workspace.getId());
        plugin = pluginRepository.findByPackageName("installed-plugin").block();
        externalDatasource.setPluginId(plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        datasource = datasourceService.create(externalDatasource).block();
    }

    @AfterEach
    public void cleanup() {
        applicationService
                .findByWorkspaceId(workspace.getId(), applicationPermission.getDeletePermission())
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        crudWorkflowService
                .getAllWorkflows(workspace.getId())
                .flatMap(workflow1 -> crudWorkflowService.deleteWorkflow(workflow1.getId()))
                .collectList()
                .block();
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testGetPopulatedActionCollectionsByViewMode_getApplicationActionCollections() {
        String testName = "testGetPopulatedActionCollectionsByViewMode_getApplicationActionCollections";
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        ActionCollectionDTO applicationActionCollectionDTO = createPageActionCollection(
                "Application Action Collection Page 1 - " + testName,
                application.getPages().get(0).getId(),
                workspace.getId(),
                application.getId(),
                datasource,
                plugin,
                actionConfiguration);
        ActionCollectionDTO workflowActionCollectionDTO = createWorkflowActionCollection(
                "Workflow Action Collection - " + testName, workflow.getId(), workspace.getId(), datasource);

        MultiValueMap<String, String> queryParamWithApplicationId = new LinkedMultiValueMap<>();
        queryParamWithApplicationId.add(FieldName.APPLICATION_ID, application.getId());
        List<ActionCollectionDTO> applicationActionCollectionDTOs = actionCollectionService
                .getPopulatedActionCollectionsByViewMode(queryParamWithApplicationId, false, null)
                .collectList()
                .block();
        assertThat(applicationActionCollectionDTOs).hasSize(1);
        assertThat(applicationActionCollectionDTOs.get(0).getId()).isEqualTo(applicationActionCollectionDTO.getId());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testGetPopulatedActionCollectionsByViewMode_getPageActionCollections() {
        String testName = "testGetPopulatedActionCollectionsByViewMode_getPageActionCollections";
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        PageDTO applicationPage2 = createPage("Page 2 - " + testName, application.getId());
        Application updatedApplication =
                applicationService.findById(application.getId()).block();

        ActionCollectionDTO page1ActionCollectionDTO = createPageActionCollection(
                "Application Action Collection Page 1 - " + testName,
                updatedApplication.getPages().get(0).getId(),
                workspace.getId(),
                updatedApplication.getId(),
                datasource,
                plugin,
                actionConfiguration);
        ActionCollectionDTO page2ActionCollectionDTO = createPageActionCollection(
                "Application Action Collection Page 2 - " + testName,
                updatedApplication.getPages().get(1).getId(),
                workspace.getId(),
                updatedApplication.getId(),
                datasource,
                plugin,
                actionConfiguration);
        ActionCollectionDTO workflowActionCollectionDTO = createWorkflowActionCollection(
                "Workflow Action Collection - " + testName, workflow.getId(), workspace.getId(), datasource);

        MultiValueMap<String, String> queryParamWithPageId1 = new LinkedMultiValueMap<>();
        queryParamWithPageId1.add(
                FieldName.PAGE_ID, application.getPages().get(0).getId());
        List<ActionCollectionDTO> page1ActionCollectionDTOs = actionCollectionService
                .getPopulatedActionCollectionsByViewMode(queryParamWithPageId1, false, null)
                .collectList()
                .block();
        assertThat(page1ActionCollectionDTOs).hasSize(1);
        assertThat(page1ActionCollectionDTOs.get(0).getId()).isEqualTo(page1ActionCollectionDTO.getId());

        MultiValueMap<String, String> queryParamWithPageId2 = new LinkedMultiValueMap<>();
        queryParamWithPageId2.add(
                FieldName.PAGE_ID, updatedApplication.getPages().get(1).getId());
        List<ActionCollectionDTO> page2ActionCollectionDTOs = actionCollectionService
                .getPopulatedActionCollectionsByViewMode(queryParamWithPageId2, false, null)
                .collectList()
                .block();
        assertThat(page2ActionCollectionDTOs).hasSize(1);
        assertThat(page2ActionCollectionDTOs.get(0).getId()).isEqualTo(page2ActionCollectionDTO.getId());

        MultiValueMap<String, String> queryParamWithApplicationId = new LinkedMultiValueMap<>();
        queryParamWithApplicationId.add(FieldName.APPLICATION_ID, application.getId());
        List<ActionCollectionDTO> applicationActionCollectionDTOs = actionCollectionService
                .getPopulatedActionCollectionsByViewMode(queryParamWithApplicationId, false, null)
                .collectList()
                .block();
        assertThat(applicationActionCollectionDTOs).hasSize(2);
        List<String> applicationActionCollectionDTOIds = applicationActionCollectionDTOs.stream()
                .map(ActionCollectionDTO::getId)
                .toList();
        assertThat(applicationActionCollectionDTOIds)
                .containsExactlyInAnyOrder(page1ActionCollectionDTO.getId(), page2ActionCollectionDTO.getId());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testGetPopulatedActionCollectionsByViewMode_getWorkflowActionCollections() {
        String testName = "testGetPopulatedActionCollectionsByViewMode_getWorkflowActionCollections";
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);

        PageDTO applicationPage2 = createPage("Page 2 - " + testName, application.getId());
        Application updatedApplication =
                applicationService.findById(application.getId()).block();

        Workflow additionalWorkflow = createWorkflow("Workflow - " + testName, workspace.getId());

        ActionCollectionDTO page1ActionCollectionDTO = createPageActionCollection(
                "Application Action Collection Page 1 - " + testName,
                updatedApplication.getPages().get(0).getId(),
                workspace.getId(),
                updatedApplication.getId(),
                datasource,
                plugin,
                actionConfiguration);
        ActionCollectionDTO page2ActionCollectionDTO = createPageActionCollection(
                "Application Action Collection Page 2 - " + testName,
                updatedApplication.getPages().get(1).getId(),
                workspace.getId(),
                updatedApplication.getId(),
                datasource,
                plugin,
                actionConfiguration);
        ActionCollectionDTO workflow1ActionCollectionDTO = createWorkflowActionCollection(
                "Workflow 1 Action Collection - " + testName, workflow.getId(), workspace.getId(), datasource);
        ActionCollectionDTO workflow2ActionCollectionDTO = createWorkflowActionCollection(
                "Workflow 2 Action Collection - " + testName,
                additionalWorkflow.getId(),
                workspace.getId(),
                datasource);

        MultiValueMap<String, String> queryParamWithApplicationId = new LinkedMultiValueMap<>();
        queryParamWithApplicationId.add(FieldName.APPLICATION_ID, application.getId());
        List<ActionCollectionDTO> applicationActionCollectionDTOs = actionCollectionService
                .getPopulatedActionCollectionsByViewMode(queryParamWithApplicationId, false, null)
                .collectList()
                .block();
        assertThat(applicationActionCollectionDTOs).hasSize(2);
        List<String> applicationActionCollectionDTOIds = applicationActionCollectionDTOs.stream()
                .map(ActionCollectionDTO::getId)
                .toList();
        assertThat(applicationActionCollectionDTOIds)
                .containsExactlyInAnyOrder(page1ActionCollectionDTO.getId(), page2ActionCollectionDTO.getId());

        MultiValueMap<String, String> queryParamWithWorkflowId1 = new LinkedMultiValueMap<>();
        queryParamWithWorkflowId1.add(FieldName.WORKFLOW_ID, workflow.getId());
        List<ActionCollectionDTO> workflow1ActionCollectionDTOs = actionCollectionService
                .getPopulatedActionCollectionsByViewMode(queryParamWithWorkflowId1, false, null)
                .collectList()
                .block();
        assertThat(workflow1ActionCollectionDTOs).hasSize(2);
        List<String> workflow1ActionCollectionDTOIds = workflow1ActionCollectionDTOs.stream()
                .map(ActionCollectionDTO::getId)
                .toList();
        assertThat(workflow1ActionCollectionDTOIds)
                .containsExactlyInAnyOrder(workflow.getMainJsObjectId(), workflow1ActionCollectionDTO.getId());

        MultiValueMap<String, String> queryParamWithWorkflowId2 = new LinkedMultiValueMap<>();
        queryParamWithWorkflowId2.add(FieldName.WORKFLOW_ID, additionalWorkflow.getId());
        List<ActionCollectionDTO> workflow2ActionCollectionDTOs = actionCollectionService
                .getPopulatedActionCollectionsByViewMode(queryParamWithWorkflowId2, false, null)
                .collectList()
                .block();
        assertThat(workflow2ActionCollectionDTOs).hasSize(2);
        List<String> workflow2ActionCollectionDTOIds = workflow2ActionCollectionDTOs.stream()
                .map(ActionCollectionDTO::getId)
                .toList();
        assertThat(workflow2ActionCollectionDTOIds)
                .containsExactlyInAnyOrder(
                        additionalWorkflow.getMainJsObjectId(), workflow2ActionCollectionDTO.getId());
    }

    private ActionCollectionDTO createPageActionCollection(
            String name,
            String pageId,
            String workspaceId,
            String applicationId,
            Datasource datasource,
            Plugin plugin,
            ActionConfiguration actionConfiguration) {
        ActionDTO action = new ActionDTO();
        action.setName("Action in JS - " + name);
        action.setPageId(pageId);
        action.setActionConfiguration(actionConfiguration);
        action.setDatasource(datasource);

        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName(name);
        actionCollectionDTO.setPageId(pageId);
        actionCollectionDTO.setActions(List.of(action));
        actionCollectionDTO.setWorkspaceId(workspaceId);
        actionCollectionDTO.setApplicationId(applicationId);
        actionCollectionDTO.setPluginId(plugin.getId());
        actionCollectionDTO.setPluginType(plugin.getType());
        return layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();
    }

    private ActionCollectionDTO createWorkflowActionCollection(
            String name, String workflowId, String workspaceId, Datasource datasource) {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName(name);
        actionCollectionDTO.setWorkflowId(workflowId);
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setWorkspaceId(workspaceId);
        actionCollectionDTO.setContextType(WORKFLOW);
        return layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();
    }

    private PageDTO createPage(String name, String applicationId) {
        PageDTO pageDTO = new PageDTO();
        pageDTO.setName(name);
        pageDTO.setApplicationId(applicationId);
        return applicationPageService.createPage(pageDTO).block();
    }

    private Workflow createWorkflow(String name, String workspaceId) {
        Workflow toCreateAdditionalWorkflow = new Workflow();
        toCreateAdditionalWorkflow.setName(name);
        return crudWorkflowService
                .createWorkflow(toCreateAdditionalWorkflow, workspaceId)
                .block();
    }
}
