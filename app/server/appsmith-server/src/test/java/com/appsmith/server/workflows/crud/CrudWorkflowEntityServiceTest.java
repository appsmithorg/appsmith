package com.appsmith.server.workflows.crud;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
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
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.external.models.CreatorContextType.WORKFLOW;
import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.constants.FieldName.WORKFLOW_ID;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
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

    @Autowired
    private ActionCollectionRepository actionCollectionRepository;

    @Autowired
    private LayoutCollectionService layoutCollectionService;

    @Autowired
    private LayoutActionService layoutActionService;

    @Autowired
    private RefactoringService refactoringService;

    @Autowired
    private ActionCollectionService actionCollectionService;

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
        actionDTO.setContextType(WORKFLOW);

        ActionDTO workflowActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

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
    @WithUserDetails("api_user")
    void testRenameWorkflowAction() {
        String testName = "testRenameWorkflowAction";
        String updatedName = testName + "_updated";
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setName(testName);
        actionDTO.setDatasource(datasource);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setHttpMethod(HttpMethod.GET);
        actionDTO.setActionConfiguration(actionConfiguration);
        actionDTO.setWorkspaceId(workspace.getId());
        actionDTO.setContextType(WORKFLOW);

        ActionDTO workflowActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

        RefactorEntityNameDTO refactorEntityNameDTO = new RefactorEntityNameDTO();
        refactorEntityNameDTO.setEntityType(EntityType.ACTION);
        refactorEntityNameDTO.setActionId(workflowActionDTO.getId());
        refactorEntityNameDTO.setWorkflowId(workflow.getId());
        refactorEntityNameDTO.setOldName(testName);
        refactorEntityNameDTO.setNewName(updatedName);
        refactorEntityNameDTO.setContextType(WORKFLOW);

        refactoringService.refactorEntityName(refactorEntityNameDTO, null).block();

        NewAction updatedWorkflowAction =
                newActionRepository.findById(workflowActionDTO.getId()).block();
        assertThat(updatedWorkflowAction.getUnpublishedAction().getName()).isEqualTo(updatedName);
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
                .isEqualTo(AppsmithError.INVALID_PARAMETER.getMessage(WORKFLOW_ID));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInvalid_createWorkflowAction_noName() {
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setContextType(WORKFLOW);
        AppsmithException validParameterNameException = assertThrows(AppsmithException.class, () -> layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block());
        assertThat(validParameterNameException.getMessage())
                .isEqualTo(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.NAME));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInvalid_createWorkflowAction_noActionConfiguration() {
        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setWorkflowId(workflow.getId());
        actionDTO.setContextType(WORKFLOW);
        actionDTO.setName("testInvalid_createWorkflowAction_noActionConfiguration");
        ActionDTO createdActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();
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
        actionDTO.setContextType(WORKFLOW);
        actionDTO.setName("testInvalid_createWorkflowAction_noActionConfiguration");
        ActionDTO createdActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();
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
        actionDTO.setContextType(WORKFLOW);

        ActionDTO workflowActionDTO = layoutActionService
                .createSingleActionWithBranch(actionDTO, null)
                .block();

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

    @Test
    @WithUserDetails(value = "api_user")
    void testValid_createWorkflowActionCollection() {
        String testName = "testValid_createWorkflowAction";
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName(testName);
        actionCollectionDTO.setWorkflowId(workflow.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setWorkspaceId(workspace.getId());
        actionCollectionDTO.setContextType(WORKFLOW);

        ActionCollectionDTO workflowActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();

        assertThat(workflowActionCollectionDTO.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(workflowActionCollectionDTO.getWorkspaceId()).isEqualTo(workspace.getId());
        Set<String> expectedUserPermissions = Set.of(
                MANAGE_ACTIONS.getValue(),
                READ_ACTIONS.getValue(),
                EXECUTE_ACTIONS.getValue(),
                DELETE_ACTIONS.getValue());
        assertThat(workflowActionCollectionDTO.getUserPermissions())
                .containsExactlyInAnyOrderElementsOf(expectedUserPermissions);

        ActionCollection createdNewAction = actionCollectionRepository
                .findById(workflowActionCollectionDTO.getId())
                .block();
        assertThat(createdNewAction.getWorkflowId()).isEqualTo(workflow.getId());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testValid_createWorkflowActionCollection_withAction() {
        String testName = "testValid_createWorkflowActionCollection_withAction";
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName(testName);
        actionCollectionDTO.setWorkflowId(workflow.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setWorkspaceId(workspace.getId());
        actionCollectionDTO.setContextType(WORKFLOW);
        ActionDTO action1 = new ActionDTO();
        action1.setName("testValid_createWorkflowActionCollection_withAction");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("testValid_createWorkflowActionCollection_withAction");
        actionCollectionDTO.setActions(List.of(action1));

        ActionCollectionDTO workflowActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();

        assertThat(workflowActionCollectionDTO.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(workflowActionCollectionDTO.getWorkspaceId()).isEqualTo(workspace.getId());
        Set<String> expectedUserPermissions = Set.of(
                MANAGE_ACTIONS.getValue(),
                READ_ACTIONS.getValue(),
                EXECUTE_ACTIONS.getValue(),
                DELETE_ACTIONS.getValue());
        assertThat(workflowActionCollectionDTO.getUserPermissions())
                .containsExactlyInAnyOrderElementsOf(expectedUserPermissions);
        assertThat(workflowActionCollectionDTO.getActions()).hasSize(1);
        ActionDTO actionInsideWorkflowActionCollectionDTO =
                workflowActionCollectionDTO.getActions().get(0);
        assertThat(actionInsideWorkflowActionCollectionDTO.getWorkflowId()).isEqualTo(workflow.getId());

        ActionCollection createdActionCollection = actionCollectionRepository
                .findById(workflowActionCollectionDTO.getId())
                .block();
        assertThat(createdActionCollection.getWorkflowId()).isEqualTo(workflow.getId());
        String actionInActionCollectionId =
                workflowActionCollectionDTO.getActions().get(0).getId();
        NewAction actionInActionCollection =
                newActionRepository.findById(actionInActionCollectionId).block();
        assertThat(actionInActionCollection.getUnpublishedAction().getContextType())
                .isEqualTo(WORKFLOW);
        assertThat(actionInActionCollection.getUnpublishedAction().getCollectionId())
                .isEqualTo(createdActionCollection.getId());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInvalid_createWorkflowActionCollection_noWorkflowId() {
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        AppsmithException validParameterNameException =
                assertThrows(AppsmithException.class, () -> crudWorkflowEntityService
                        .createWorkflowActionCollection(actionCollectionDTO, null)
                        .block());
        assertThat(validParameterNameException.getMessage())
                .isEqualTo(AppsmithError.INVALID_PARAMETER.getMessage(WORKFLOW_ID));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testRenameWorkflowActionCollection() {
        String testName = "testRenameWorkflowActionCollection";
        String updatedName = testName + "_updated";
        ActionCollectionDTO actionCollectionDTO = new ActionCollectionDTO();
        actionCollectionDTO.setName(testName);
        actionCollectionDTO.setWorkflowId(workflow.getId());
        actionCollectionDTO.setPluginId(datasource.getPluginId());
        actionCollectionDTO.setPluginType(PluginType.JS);
        actionCollectionDTO.setWorkspaceId(workspace.getId());
        actionCollectionDTO.setContextType(WORKFLOW);

        ActionCollectionDTO workflowActionCollectionDTO = layoutCollectionService
                .createCollection(actionCollectionDTO, null)
                .block();

        RefactorEntityNameDTO refactorEntityNameDTO = new RefactorEntityNameDTO();
        refactorEntityNameDTO.setEntityType(EntityType.JS_OBJECT);
        refactorEntityNameDTO.setActionCollectionId(workflowActionCollectionDTO.getId());
        refactorEntityNameDTO.setWorkflowId(workflow.getId());
        refactorEntityNameDTO.setOldName(testName);
        refactorEntityNameDTO.setNewName(updatedName);
        refactorEntityNameDTO.setContextType(WORKFLOW);

        refactoringService.refactorEntityName(refactorEntityNameDTO, null).block();

        ActionCollection updatedWorkflowActionCollection = actionCollectionRepository
                .findById(workflowActionCollectionDTO.getId())
                .block();

        assertThat(updatedWorkflowActionCollection.getUnpublishedCollection().getName())
                .isEqualTo(updatedName);
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testRenameJSActionInWorkflowActionCollection() {
        Plugin installedJsPlugin =
                pluginRepository.findByPackageName("installed-js-plugin").block();

        ActionCollectionDTO actionCollectionDTO1 = new ActionCollectionDTO();
        actionCollectionDTO1.setName("testCollection1");
        actionCollectionDTO1.setContextType(WORKFLOW);
        actionCollectionDTO1.setWorkflowId(workflow.getId());
        actionCollectionDTO1.setPluginId(installedJsPlugin.getId());
        ActionDTO action1 = new ActionDTO();
        action1.setName("testAction1");
        action1.setActionConfiguration(new ActionConfiguration());
        action1.getActionConfiguration().setBody("mockBody");
        actionCollectionDTO1.setActions(List.of(action1));
        actionCollectionDTO1.setPluginType(PluginType.JS);
        actionCollectionDTO1.setBody("export default { x: 1 }");

        final ActionCollectionDTO createdActionCollectionDTO1 = layoutCollectionService
                .createCollection(actionCollectionDTO1, null)
                .block();

        ActionCollectionDTO actionCollectionDTO2 = new ActionCollectionDTO();
        actionCollectionDTO2.setName("testCollection2");
        actionCollectionDTO2.setContextType(WORKFLOW);
        actionCollectionDTO2.setWorkflowId(workflow.getId());
        actionCollectionDTO2.setPluginId(installedJsPlugin.getId());
        ActionDTO action2 = new ActionDTO();
        action2.setActionConfiguration(new ActionConfiguration());
        action2.setName("testAction2");
        action2.getActionConfiguration().setBody("testCollection1.testAction1()");
        actionCollectionDTO2.setActions(List.of(action2));
        actionCollectionDTO2.setPluginType(PluginType.JS);
        actionCollectionDTO2.setBody("export default { x: testCollection1.testAction1() }");

        final ActionCollectionDTO createdActionCollectionDTO2 = layoutCollectionService
                .createCollection(actionCollectionDTO2, null)
                .block();

        ActionDTO jsActionInWorkflowActionCollection =
                createdActionCollectionDTO1.getActions().get(0);

        RefactorEntityNameDTO refactorEntityNameDTO = new RefactorEntityNameDTO();
        refactorEntityNameDTO.setEntityType(EntityType.JS_ACTION);
        refactorEntityNameDTO.setActionCollection(createdActionCollectionDTO1);
        refactorEntityNameDTO.setActionId(jsActionInWorkflowActionCollection.getId());
        refactorEntityNameDTO.setWorkflowId(workflow.getId());
        refactorEntityNameDTO.setOldName("testAction1");
        refactorEntityNameDTO.setNewName("newTestAction1");
        refactorEntityNameDTO.setContextType(WORKFLOW);
        refactorEntityNameDTO.setCollectionName(createdActionCollectionDTO1.getName());

        refactoringService.refactorEntityName(refactorEntityNameDTO, null).block();
        LinkedMultiValueMap<String, String> queryParams = new LinkedMultiValueMap<>();
        queryParams.add(WORKFLOW_ID, workflow.getId());
        List<ActionCollectionDTO> actionCollectionDTOList = actionCollectionService
                .getPopulatedActionCollectionsByViewMode(queryParams, false, null)
                .collectList()
                .block();

        // 3 JS Objects
        // 1. One Main JS Object
        // 2. Two Additional JS Objects
        assertThat(actionCollectionDTOList).hasSize(3);
        Optional<ActionCollectionDTO> optionalWorkflowActionCollectionDTO = actionCollectionDTOList.stream()
                .filter(actionCollectionViewDTO ->
                        actionCollectionViewDTO.getId().equals(createdActionCollectionDTO1.getId()))
                .findFirst();
        assertThat(optionalWorkflowActionCollectionDTO.isPresent()).isTrue();

        List<ActionDTO> renamedActionsInWorkflowActionCollection =
                optionalWorkflowActionCollectionDTO.get().getActions();
        assertThat(renamedActionsInWorkflowActionCollection).hasSize(1);

        // Assert that name has been changed
        assertThat(renamedActionsInWorkflowActionCollection.get(0).getName()).isEqualTo("newTestAction1");
        assertThat(renamedActionsInWorkflowActionCollection.get(0).getFullyQualifiedName())
                .isEqualTo(createdActionCollectionDTO1.getName() + ".newTestAction1");

        final Mono<ActionCollection> actionCollectionMono =
                actionCollectionService.getById(createdActionCollectionDTO2.getId());

        // Assert that name is refactored in mentioned JS Objects
        StepVerifier.create(actionCollectionMono)
                .assertNext(actionCollection -> assertEquals(
                        "export default { x: testCollection1.newTestAction1() }",
                        actionCollection.getUnpublishedCollection().getBody()))
                .verifyComplete();
    }
}
