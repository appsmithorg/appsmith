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
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class CrudWorkflowEntityServiceTest {

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

    @Autowired
    private CrudWorkflowEntityService crudWorkflowEntityService;

    Workspace workspace;
    String defaultEnvironmentId;
    Workflow workflow;

    Datasource datasource;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_workflows_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace toCreateWorkspace = new Workspace();
        toCreateWorkspace.setName("Workspace - CrudWorkflowServiceTest");

        workspace = workspaceService.create(toCreateWorkspace).block();

        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspace.getId(), environmentPermission.getExecutePermission())
                .block();

        Workflow toCreateWorkflow = new Workflow();
        toCreateWorkflow.setName("Workflow - CrudWorkflowEntityServiceTest");
        workflow = crudWorkflowService
                .createWorkflow(toCreateWorkflow, workspace.getId())
                .block();

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
        datasource = datasourceService.create(externalDatasource).block();
    }

    @AfterEach
    public void cleanup() {
        crudWorkflowService
                .getAllWorkflows(workspace.getId())
                .flatMap(workflow1 -> crudWorkflowService.deleteWorkflow(workflow1.getId()))
                .collectList()
                .block();
        workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testValid_createWorkflowAction() {
        String testName = "testValid_createWorkflowAction";
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setName(testName);
        actionDTO.setDatasource(datasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionDTO.setActionConfiguration(actionConfiguration);
        actionDTO.setWorkspaceId(workspace.getId());
        actionDTO.setContextType(CreatorContextType.WORKFLOW);

        ActionDTO workflowActionDTO =
                crudWorkflowEntityService.createWorkflowAction(actionDTO, null).block();

        assertThat(workflowActionDTO.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(workflowActionDTO.getWorkspaceId()).isEqualTo(workspace.getId());
        assertThat(workflowActionDTO.getDatasource().getId()).isEqualTo(datasource.getId());
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
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInvalid_createWorkflowAction_noWorkflowId() {
        ActionDTO actionDTO = new ActionDTO();
        AppsmithException validParameterNameException =
                assertThrows(AppsmithException.class, () -> crudWorkflowEntityService
                        .createWorkflowAction(actionDTO, null)
                        .block());
        assertThat(validParameterNameException.getMessage())
                .isEqualTo(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.WORKFLOW_ID));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInvalid_createWorkflowAction_noName() {
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        AppsmithException validParameterNameException =
                assertThrows(AppsmithException.class, () -> crudWorkflowEntityService
                        .createWorkflowAction(actionDTO, null)
                        .block());
        assertThat(validParameterNameException.getMessage())
                .isEqualTo(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInvalid_createWorkflowAction_noActionConfiguration() {
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setName("testInvalid_createWorkflowAction_noActionConfiguration");
        ActionDTO createdActionDTO =
                crudWorkflowEntityService.createWorkflowAction(actionDTO, null).block();
        assert createdActionDTO != null;
        assertThat(createdActionDTO.getIsValid()).isFalse();
        assertThat(createdActionDTO.getInvalids()).isNotEmpty();
        assertThat(createdActionDTO.getInvalids())
                .contains(AppsmithError.NO_CONFIGURATION_FOUND_IN_ACTION.getMessage());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInvalid_createWorkflowAction_noDatasource() {
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setName("testInvalid_createWorkflowAction_noActionConfiguration");
        ActionDTO createdActionDTO =
                crudWorkflowEntityService.createWorkflowAction(actionDTO, null).block();
        assert createdActionDTO != null;
        assertThat(createdActionDTO.getIsValid()).isFalse();
        assertThat(createdActionDTO.getInvalids()).isNotEmpty();
        assertThat(createdActionDTO.getInvalids()).contains(AppsmithError.DATASOURCE_NOT_GIVEN.getMessage());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testValid_updateWorkflowAction_updateName() {
        String testName = "testValid_updateWorkflowAction_updateName";
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setName(testName);
        actionDTO.setDatasource(datasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionDTO.setActionConfiguration(actionConfiguration);
        actionDTO.setWorkspaceId(workspace.getId());
        actionDTO.setContextType(CreatorContextType.WORKFLOW);

        ActionDTO workflowActionDTO =
                crudWorkflowEntityService.createWorkflowAction(actionDTO, null).block();

        ActionDTO updateNameForActionDTO = new ActionDTO();
        updateNameForActionDTO.setName(testName + "_updated");

        crudWorkflowEntityService
                .updateWorkflowAction(workflowActionDTO.getId(), updateNameForActionDTO)
                .block();

        NewAction updatedAction =
                newActionRepository.findById(workflowActionDTO.getId()).block();
        assert updatedAction != null;
        assertThat(updatedAction.getUnpublishedAction().getName()).isEqualTo(testName + "_updated");
    }
}
