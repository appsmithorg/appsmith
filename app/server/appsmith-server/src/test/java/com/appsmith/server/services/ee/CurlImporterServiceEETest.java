package com.appsmith.server.services.ee;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.CurlImporterService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.workflows.crud.CrudWorkflowService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class CurlImporterServiceEETest {

    @Autowired
    CurlImporterService curlImporterService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor<Object> pluginExecutor;

    @Autowired
    WorkspaceService workspaceService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    CrudWorkflowService crudWorkflowService;

    @Autowired
    NewActionRepository newActionRepository;

    Workspace workspace;
    Workflow workflow;

    @BeforeEach
    void setUp() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_workflows_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Workspace toCreateWorkspace = new Workspace();
        toCreateWorkspace.setName("Workspace - CurlImporterServiceEETest");

        workspace = workspaceService.create(toCreateWorkspace).block();

        Workflow toCreateWorkflow = new Workflow();
        toCreateWorkflow.setName("Workflow - CurlImporterServiceEETest");
        workflow = crudWorkflowService
                .createWorkflow(toCreateWorkflow, workspace.getId())
                .block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testImportActionOnInvalidInput() {
        ActionDTO workflowActionDTO = curlImporterService
                .importAction(
                        "curl --location 'https://dev.appsmith.com/api/v1/users/me'",
                        CreatorContextType.WORKFLOW,
                        workflow.getId(),
                        "actionName",
                        workspace.getId(),
                        null)
                .block();

        assertThat(workflowActionDTO.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(workflowActionDTO.getWorkspaceId()).isEqualTo(workspace.getId());
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
}
