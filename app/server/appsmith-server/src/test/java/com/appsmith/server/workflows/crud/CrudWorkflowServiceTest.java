package com.appsmith.server.workflows.crud;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.EXPORT_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.READ_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.RESOLVE_WORKFLOWS;
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

    Workspace workspace;

    @BeforeEach
    public void setup() {
        Workspace toCreateWorkspace = new Workspace();
        toCreateWorkspace.setName("CrudWorkflowServiceTest Workspace");

        workspace = workspaceService.create(toCreateWorkspace).block();

        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_workflows_enabled)))
                .thenReturn(Mono.just(TRUE));
    }

    @Test
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
                            RESOLVE_WORKFLOWS.getValue());

                    assertThat(userPermissions).containsExactlyInAnyOrderElementsOf(expectedUserPermissions);
                })
                .verifyComplete();
    }

    @Test
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

    @Test
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

    @Test
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

    @Test
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

    @Test
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

    @Test
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

    @Test
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
}
