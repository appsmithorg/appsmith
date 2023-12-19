package com.appsmith.server.services.ee;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
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

import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class NewActionServiceTest {

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
    void testGetUnpublishedActionsExceptJs_getApplicationActions() {
        String testName = "testGetUnpublishedActionsExceptJs_getApplicationActions";
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        ActionDTO applicationActionDTO = createPageAction(
                "Application Action - " + testName,
                application.getPages().get(0).getId(),
                datasource,
                plugin.getId(),
                actionConfiguration);

        ActionDTO workflowActionDTO = createWorkflowAction(
                "Workflow Action - " + testName, workflow.getId(), datasource, plugin.getId(), actionConfiguration);

        MultiValueMap<String, String> queryParamWithApplicationId = new LinkedMultiValueMap<>();
        queryParamWithApplicationId.add(FieldName.APPLICATION_ID, application.getId());
        List<ActionDTO> applicationActionDTOs = newActionService
                .getUnpublishedActionsExceptJs(queryParamWithApplicationId, null)
                .collectList()
                .block();
        assertThat(applicationActionDTOs).hasSize(1);
        assertThat(applicationActionDTOs.get(0).getId()).isEqualTo(applicationActionDTO.getId());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testGetUnpublishedActionsExceptJs_getPageActions() {
        String testName = "testGetUnpublishedActionsExceptJs_getPageActions";
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        PageDTO applicationPage2 = createPage("Page 2 - " + testName, application.getId());
        Application updatedApplication =
                applicationService.findById(application.getId()).block();

        ActionDTO page1ActionDTO = createPageAction(
                "Application Action Page 1 - " + testName,
                updatedApplication.getPages().get(0).getId(),
                datasource,
                plugin.getId(),
                actionConfiguration);
        ActionDTO page2ActionDTO = createPageAction(
                "Application Action Page 2 - " + testName,
                updatedApplication.getPages().get(1).getId(),
                datasource,
                plugin.getId(),
                actionConfiguration);
        ActionDTO workflowActionDTO = createWorkflowAction(
                "Workflow Action - " + testName, workflow.getId(), datasource, plugin.getId(), actionConfiguration);

        MultiValueMap<String, String> queryParamWithPageId1 = new LinkedMultiValueMap<>();
        queryParamWithPageId1.add(
                FieldName.PAGE_ID, application.getPages().get(0).getId());
        List<ActionDTO> page1ActionDTOs = newActionService
                .getUnpublishedActionsExceptJs(queryParamWithPageId1, null)
                .collectList()
                .block();
        assertThat(page1ActionDTOs).hasSize(1);
        assertThat(page1ActionDTOs.get(0).getId()).isEqualTo(page1ActionDTO.getId());

        MultiValueMap<String, String> queryParamWithPageId2 = new LinkedMultiValueMap<>();
        queryParamWithPageId2.add(
                FieldName.PAGE_ID, updatedApplication.getPages().get(1).getId());
        List<ActionDTO> page2ActionDTOs = newActionService
                .getUnpublishedActionsExceptJs(queryParamWithPageId2, null)
                .collectList()
                .block();
        assertThat(page2ActionDTOs).hasSize(1);
        assertThat(page2ActionDTOs.get(0).getId()).isEqualTo(page2ActionDTO.getId());

        MultiValueMap<String, String> queryParamWithApplicationId = new LinkedMultiValueMap<>();
        queryParamWithApplicationId.add(FieldName.APPLICATION_ID, application.getId());
        List<ActionDTO> applicationActionDTOs = newActionService
                .getUnpublishedActionsExceptJs(queryParamWithApplicationId, null)
                .collectList()
                .block();
        assertThat(applicationActionDTOs).hasSize(2);
        List<String> applicationActionDTOIds =
                applicationActionDTOs.stream().map(ActionDTO::getId).toList();
        assertThat(applicationActionDTOIds).containsExactlyInAnyOrder(page1ActionDTO.getId(), page2ActionDTO.getId());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testGetUnpublishedActionsExceptJs_getWorkflowActions() {
        String testName = "testGetUnpublishedActionsExceptJs_getWorkflowActions";
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);

        PageDTO applicationPage2 = createPage("Page 2 - " + testName, application.getId());
        Application updatedApplication =
                applicationService.findById(application.getId()).block();

        Workflow additionalWorkflow = createWorkflow("Workflow - " + testName, workspace.getId());

        ActionDTO page1ActionDTO = createPageAction(
                "Application Action Page 1 - " + testName,
                updatedApplication.getPages().get(0).getId(),
                datasource,
                plugin.getId(),
                actionConfiguration);
        ActionDTO page2ActionDTO = createPageAction(
                "Application Action Page 2 - " + testName,
                updatedApplication.getPages().get(1).getId(),
                datasource,
                plugin.getId(),
                actionConfiguration);
        ActionDTO workflow1ActionDTO = createWorkflowAction(
                "Workflow 1 Action - " + testName, workflow.getId(), datasource, plugin.getId(), actionConfiguration);
        ActionDTO workflow2ActionDTO = createWorkflowAction(
                "Workflow 2 Action - " + testName,
                additionalWorkflow.getId(),
                datasource,
                plugin.getId(),
                actionConfiguration);

        MultiValueMap<String, String> queryParamWithApplicationId = new LinkedMultiValueMap<>();
        queryParamWithApplicationId.add(FieldName.APPLICATION_ID, application.getId());
        List<ActionDTO> applicationActionDTOs = newActionService
                .getUnpublishedActionsExceptJs(queryParamWithApplicationId, null)
                .collectList()
                .block();
        assertThat(applicationActionDTOs).hasSize(2);
        List<String> applicationActionDTOIds =
                applicationActionDTOs.stream().map(ActionDTO::getId).toList();
        assertThat(applicationActionDTOIds).containsExactlyInAnyOrder(page1ActionDTO.getId(), page2ActionDTO.getId());

        MultiValueMap<String, String> queryParamWithWorkflowId1 = new LinkedMultiValueMap<>();
        queryParamWithWorkflowId1.add(FieldName.WORKFLOW_ID, workflow.getId());
        List<ActionDTO> workflow1ActionDTOs = newActionService
                .getUnpublishedActionsExceptJs(queryParamWithWorkflowId1, null)
                .collectList()
                .block();
        assertThat(workflow1ActionDTOs).hasSize(1);
        assertThat(workflow1ActionDTOs.get(0).getId()).isEqualTo(workflow1ActionDTO.getId());

        MultiValueMap<String, String> queryParamWithWorkflowId2 = new LinkedMultiValueMap<>();
        queryParamWithWorkflowId2.add(FieldName.WORKFLOW_ID, additionalWorkflow.getId());
        List<ActionDTO> workflow2ActionDTOs = newActionService
                .getUnpublishedActionsExceptJs(queryParamWithWorkflowId2, null)
                .collectList()
                .block();
        assertThat(workflow2ActionDTOs).hasSize(1);
        assertThat(workflow2ActionDTOs.get(0).getId()).isEqualTo(workflow2ActionDTO.getId());
    }

    private ActionDTO createPageAction(
            String name,
            String pageId,
            Datasource datasource,
            String pluginId,
            ActionConfiguration actionConfiguration) {
        ActionDTO pageActionDTO = new ActionDTO();
        pageActionDTO.setName(name);
        pageActionDTO.setPageId(pageId);
        pageActionDTO.setExecuteOnLoad(true);
        pageActionDTO.setActionConfiguration(actionConfiguration);
        pageActionDTO.setDatasource(datasource);
        pageActionDTO.setPluginId(pluginId);
        return layoutActionService.createAction(pageActionDTO).block();
    }

    private ActionDTO createWorkflowAction(
            String name,
            String workflowId,
            Datasource datasource,
            String pluginId,
            ActionConfiguration actionConfiguration) {
        ActionDTO workflowActionDTO = new ActionDTO();
        workflowActionDTO.setName(name);
        workflowActionDTO.setWorkflowId(workflowId);
        workflowActionDTO.setContextType(CreatorContextType.WORKFLOW);
        workflowActionDTO.setExecuteOnLoad(true);
        workflowActionDTO.setActionConfiguration(actionConfiguration);
        workflowActionDTO.setDatasource(datasource);
        workflowActionDTO.setPluginId(pluginId);
        return layoutActionService
                .createSingleActionWithBranch(workflowActionDTO, null)
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
