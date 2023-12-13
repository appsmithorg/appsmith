package com.appsmith.server.workflows.helpers;

import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QUser;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.workflows.crud.CrudWorkflowService;
import com.appsmith.server.workflows.interact.InteractWorkflowService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class WorkflowHelperTest {

    @SpyBean
    private FeatureFlagService featureFlagService;

    @Autowired
    private WorkspaceService workspaceService;

    @Autowired
    private CrudWorkflowService crudWorkflowService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private WorkflowHelper workflowHelper;

    @Autowired
    private InteractWorkflowService interactWorkflowService;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    @Autowired
    ReactiveMongoOperations reactiveMongoOperations;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    private PluginExecutor pluginExecutor;

    private Workspace workspace;
    private Workflow workflow;

    @BeforeEach
    void setUp() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_workflows_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(
                FeatureFlagEnum.license_gac_enabled.name(),
                TRUE,
                FeatureFlagEnum.release_workflows_enabled.name(),
                TRUE));
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);

        Workspace workspace1 = new Workspace();
        workspace1.setName("WorkflowHelperTest");
        workspace = workspaceService.create(workspace1).block();

        Workflow workflow1 = new Workflow();
        workflow1.setName("WorkflowHelperTest");
        workflow =
                crudWorkflowService.createWorkflow(workflow1, workspace.getId()).block();

        User apiUser = userRepository.findByCaseInsensitiveEmail("api_user").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void generateWorkflowBotUserEmail() {
        assertThat(workflowHelper.generateWorkflowBotUserEmail(workflow))
                .isEqualTo(String.format(
                                "%s_%s_%s@appsmith.com",
                                workflow.getName(),
                                workflow.getId(),
                                workflow.getCreatedAt().toEpochMilli())
                        .toLowerCase());
    }

    @Test
    @WithUserDetails(value = "api_user")
    void generateWorkflowBotUserName() {
        assertThat(workflowHelper.generateWorkflowBotUserName(workflow))
                .isEqualTo(String.format("Workflow Bot User - %s", workflow.getName()));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void generateWorkflowBotRoleName() {
        assertThat(workflowHelper.generateWorkflowBotRoleName(workflow))
                .isEqualTo(String.format("%s - %s", FieldName.WORKFLOW_EXECUTOR, workflow.getName()));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void updateWorkflowBotRoleAndUserDetails() {
        String tokenForWorkflow = interactWorkflowService
                .generateBearerTokenForWebhook(workflow.getId())
                .block();
        Workflow updateWorkflow = new Workflow();
        updateWorkflow.setName(workflow.getName() + "_updated");
        updateWorkflow.setCreatedAt(workflow.getCreatedAt());
        updateWorkflow.setId(workflow.getId());
        Boolean workflowBotRoleAndUserUpdated = workflowHelper
                .updateWorkflowBotRoleAndUserDetails(workflow, updateWorkflow)
                .block();
        List<PermissionGroup> workflowRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workflow.getId(), Workflow.class.getSimpleName())
                .collectList()
                .block();
        assertThat(workflowRoles).hasSize(1);
        PermissionGroup workflowRole = workflowRoles.get(0);
        workflowRole.getName().equals(workflowHelper.generateWorkflowBotRoleName(updateWorkflow));

        User updatedUser = userRepository
                .findByCaseInsensitiveEmail(workflowHelper.generateWorkflowBotUserEmail(updateWorkflow))
                .block();
        assertThat(updatedUser).isNotNull();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void archiveWorkflowBotRoleAndUser() {
        String tokenForWorkflow = interactWorkflowService
                .generateBearerTokenForWebhook(workflow.getId())
                .block();
        workflowHelper.archiveWorkflowBotRoleAndUser(workflow).block();
        List<PermissionGroup> workflowRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workflow.getId(), Workflow.class.getSimpleName())
                .collectList()
                .block();
        assertThat(workflowRoles).hasSize(0);
        Criteria userEmailCriteria = Criteria.where(fieldName(QUser.user.email))
                .is(workflowHelper.generateWorkflowBotUserEmail(workflow).toLowerCase());
        Query userEmailQuery = Query.query(userEmailCriteria);
        List<User> userList = reactiveMongoOperations
                .find(userEmailQuery, User.class)
                .collectList()
                .block();
        assertThat(userList).hasSize(0);
    }
}
