package com.appsmith.server.workflows.crud;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.EXPORT_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_HISTORY_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.READ_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.WORKFLOW_CREATE_ACTIONS;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class CrudWorkflowServiceTest {
    @Autowired
    CrudWorkflowService crudWorkflowService;

    @Autowired
    WorkspaceService workspaceService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    EnvironmentPermission environmentPermission;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    private PluginRepository pluginRepository;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private NewActionRepository newActionRepository;

    Workspace workspace;
    String defaultEnvironmentId;

    @BeforeEach
    public void setup() {
        Workspace toCreateWorkspace = new Workspace();
        toCreateWorkspace.setName("CrudWorkflowServiceTest Workspace");

        workspace = workspaceService.create(toCreateWorkspace).block();

        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_workflows_enabled)))
                .thenReturn(Mono.just(TRUE));
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void createValidWorkflow() {

        Workflow toCreate = new Workflow();
        toCreate.setName("createValidWorkflow Workflow");

        Mono<Workflow> workflowMono = crudWorkflowService.createWorkflow(toCreate, workspace.getId());

        StepVerifier.create(workflowMono)
                .assertNext(workflow -> {
                    assertThat(workflow.getId()).isNotNull();
                    assertThat(workflow.getName()).isEqualTo(toCreate.getName());
                    assertThat(workflow.getModifiedBy()).isEqualTo("api_user");

                    Set<String> userPermissions = workflow.getUserPermissions();
                    assertThat(userPermissions).isNotNull();

                    Set<String> expectedUserPermissions = Set.of(
                            MANAGE_WORKFLOWS.getValue(),
                            READ_WORKFLOWS.getValue(),
                            PUBLISH_WORKFLOWS.getValue(),
                            DELETE_WORKFLOWS.getValue(),
                            EXPORT_WORKFLOWS.getValue(),
                            EXECUTE_WORKFLOWS.getValue(),
                            WORKFLOW_CREATE_ACTIONS.getValue(),
                            READ_HISTORY_WORKFLOWS.getValue());

                    assertThat(userPermissions).containsExactlyInAnyOrderElementsOf(expectedUserPermissions);
                })
                .verifyComplete();
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void createWorkflow_missingName() {

        Workflow toCreate = new Workflow();
        toCreate.setName(null);

        Mono<Workflow> workflowMono = crudWorkflowService.createWorkflow(toCreate, workspace.getId());

        StepVerifier.create(workflowMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME)))
                .verify();
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void createWorkflow_missingWorkspaceId() {

        Workflow toCreate = new Workflow();
        toCreate.setName("createWorkflow_missingWorkspaceId");

        Mono<Workflow> workflowMono = crudWorkflowService.createWorkflow(toCreate, null);

        StepVerifier.create(workflowMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.WORKSPACE_ID)))
                .verify();
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void validUpdateWorkflow() {

        Workflow originalWorkflow = new Workflow();
        originalWorkflow.setName("validUpdateWorkflow Workflow");

        Workflow createdWorkflow = crudWorkflowService
                .createWorkflow(originalWorkflow, workspace.getId())
                .block();

        Workflow updateWorkflow = new Workflow();
        String newName = "New Name for validUpdateWorkflow Workflow";
        updateWorkflow.setName(newName);

        Mono<Workflow> workflowMono = crudWorkflowService.updateWorkflow(updateWorkflow, createdWorkflow.getId());

        StepVerifier.create(workflowMono)
                .assertNext(workflow -> {
                    assertThat(workflow.getName()).isEqualTo(newName);
                })
                .verifyComplete();
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void getAllWorkflowsValid() {
        Workflow toCreate = new Workflow();
        toCreate.setName("getAllWorkflowsValid Workflow 1");

        crudWorkflowService.createWorkflow(toCreate, workspace.getId()).block();

        toCreate = new Workflow();
        toCreate.setName("getAllWorkflowsValid Workflow 2");

        crudWorkflowService.createWorkflow(toCreate, workspace.getId()).block();

        Mono<List<Workflow>> workflowListMono =
                crudWorkflowService.getAllWorkflows(workspace.getId()).collectList();

        StepVerifier.create(workflowListMono)
                .assertNext(workflows -> {
                    assertThat(workflows.size()).isEqualTo(2);
                    workflows.stream().map(workflow -> {
                        assertThat(workflow.getName().startsWith("getAllWorkflowsValid"));
                        return workflow;
                    });
                })
                .verifyComplete();
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void getAllWorkflowsInvaalid() {

        Mono<List<Workflow>> workflowListMono =
                crudWorkflowService.getAllWorkflows("randomString").collectList();

        StepVerifier.create(workflowListMono)
                .assertNext(workflows -> {
                    assertThat(workflows.size()).isEqualTo(0);
                })
                .verifyComplete();
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void getWorkflowById() {
        Workflow toCreate = new Workflow();
        String name = "getWorkflowById Workflow";
        toCreate.setName(name);

        Workflow createdWorkflow =
                crudWorkflowService.createWorkflow(toCreate, workspace.getId()).block();

        Mono<Workflow> workflowMono = crudWorkflowService.getWorkflowById(createdWorkflow.getId());

        StepVerifier.create(workflowMono)
                .assertNext(workflow -> {
                    assertThat(workflow.getName()).isEqualTo(name);
                })
                .verifyComplete();
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void deleteWorkflowTest() {

        Workflow toCreate = new Workflow();
        String name = "deleteWorkflowTest Workflow";
        toCreate.setName(name);

        Workflow createdWorkflow =
                crudWorkflowService.createWorkflow(toCreate, workspace.getId()).block();

        Mono<Workflow> deleteWorkflowMono =
                crudWorkflowService.deleteWorkflow(createdWorkflow.getId()).cache();

        // Assert that the delete flow completes successfully without errors
        StepVerifier.create(deleteWorkflowMono)
                .assertNext(deletedWorkflow -> {
                    assertThat(deletedWorkflow.getName()).isEqualTo(name);
                })
                .verifyComplete();

        // Assert that the workflow is deleted by trying to fetch it.
        Mono<Workflow> getWorkflowMono =
                deleteWorkflowMono.then(crudWorkflowService.getWorkflowById(createdWorkflow.getId()));

        StepVerifier.create(getWorkflowMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .contains(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(
                                        FieldName.WORKFLOW_ID, createdWorkflow.getId())))
                .verify();
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void testValid_createWorkflowAction() {
        String testName = "testValid_createWorkflowAction";
        Workflow workflow = new Workflow();
        workflow.setName(testName);
        Workflow createdWorkflow =
                crudWorkflowService.createWorkflow(workflow, workspace.getId()).block();

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("updateShouldNotResetUserSetOnLoad Database");
        externalDatasource.setWorkspaceId(workspace.getId());
        Plugin installed_plugin =
                pluginRepository.findByPackageName("installed-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName(testName);
        actionDTO.setDatasource(savedDs);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionDTO.setActionConfiguration(actionConfiguration);
        actionDTO.setWorkspaceId(workspace.getId());
        actionDTO.setContextType(CreatorContextType.WORKFLOW);

        ActionDTO workflowActionDTO = crudWorkflowService
                .createWorkflowAction(workflow.getId(), actionDTO)
                .block();

        assertThat(workflowActionDTO.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(workflowActionDTO.getWorkspaceId()).isEqualTo(workspace.getId());
        assertThat(workflowActionDTO.getDatasource().getId()).isEqualTo(savedDs.getId());
        assertThat(workflowActionDTO.getWorkflowId()).isEqualTo(workflow.getId());
        Set<String> expectedUserPermissions = Set.of(
                MANAGE_ACTIONS.getValue(),
                READ_ACTIONS.getValue(),
                EXECUTE_ACTIONS.getValue(),
                DELETE_ACTIONS.getValue());
        assertThat(workflowActionDTO.getUserPermissions()).containsExactlyInAnyOrderElementsOf(expectedUserPermissions);

        NewAction createdNewAction =
                newActionRepository.findById(workflowActionDTO.getId()).block();
        assertThat(createdNewAction.getWorkflowId()).isEqualTo(workflow.getId());

        Workflow deleteWorkflow =
                crudWorkflowService.deleteWorkflow(createdWorkflow.getId()).block();
    }

    //    @Test
    @WithUserDetails(value = "api_user")
    public void testValid_deleteWorkflow_shouldDeleteAction() {
        String testName = "testValid_deleteWorkflow_shouldDeleteAction";
        Workflow workflow = new Workflow();
        workflow.setName(testName);
        Workflow createdWorkflow =
                crudWorkflowService.createWorkflow(workflow, workspace.getId()).block();

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource externalDatasource = new Datasource();
        externalDatasource.setName("updateShouldNotResetUserSetOnLoad Database");
        externalDatasource.setWorkspaceId(workspace.getId());
        Plugin installed_plugin =
                pluginRepository.findByPackageName("installed-plugin").block();
        externalDatasource.setPluginId(installed_plugin.getId());
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("some url here");

        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(
                defaultEnvironmentId, new DatasourceStorageDTO(null, defaultEnvironmentId, datasourceConfiguration));
        externalDatasource.setDatasourceStorages(storages);
        Datasource savedDs = datasourceService.create(externalDatasource).block();

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName(testName);
        actionDTO.setDatasource(savedDs);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionDTO.setActionConfiguration(actionConfiguration);
        actionDTO.setWorkspaceId(workspace.getId());
        actionDTO.setContextType(CreatorContextType.WORKFLOW);

        ActionDTO workflowActionDTO = crudWorkflowService
                .createWorkflowAction(workflow.getId(), actionDTO)
                .block();

        Workflow deleteWorkflow =
                crudWorkflowService.deleteWorkflow(createdWorkflow.getId()).block();

        Mono<NewAction> deletedNewActionMono = newActionRepository.findById(workflowActionDTO.getId());
        StepVerifier.create(deletedNewActionMono).verifyComplete();
    }
}
