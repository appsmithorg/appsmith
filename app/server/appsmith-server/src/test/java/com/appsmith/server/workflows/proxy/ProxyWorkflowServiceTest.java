package com.appsmith.server.workflows.proxy;

import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.workflows.crud.CrudWorkflowService;
import com.appsmith.server.workflows.helpers.WorkflowProxyHelper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.FieldName.WORKFLOW;
import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.constants.ce.FieldNameCE.VIEWER;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class ProxyWorkflowServiceTest {

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    WorkflowProxyHelper workflowProxyHelper;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    CrudWorkflowService workflowService;

    @Autowired
    UserService userService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Autowired
    ProxyWorkflowService proxyWorkflowService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    private PluginExecutor pluginExecutor;

    Workspace workspace = null;
    Workflow workflow = null;
    PermissionGroup workspaceAdminRole = null;
    PermissionGroup workspaceDevRole = null;
    PermissionGroup workspaceViewRole = null;

    private <I> Mono<I> runAs(Mono<I> input, User user, String password) {
        log.info("Running as user: {}", user.getEmail());
        return input.contextWrite((ctx) -> {
            SecurityContext securityContext = new SecurityContextImpl(
                    new UsernamePasswordAuthenticationToken(user, password, user.getAuthorities()));
            return ctx.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

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
        workspace1.setName("CrudApprovalRequestServiceTest");
        workspace = workspaceService.create(workspace1).block();

        List<PermissionGroup> workspaceRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        workspaceAdminRole = workspaceRoles.stream()
                .filter(role -> role.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();
        workspaceDevRole = workspaceRoles.stream()
                .filter(role -> role.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();
        workspaceViewRole = workspaceRoles.stream()
                .filter(role -> role.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Workflow workflow1 = new Workflow();
        workflow1.setName("CrudApprovalRequestServiceTest");
        workflow = workflowService.createWorkflow(workflow1, workspace.getId()).block();

        User apiUser = userRepository
                .findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("api_user")
                .block();
        userUtils.makeSuperUser(List.of(apiUser)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInvalidGetWorkflowRunActivities() {
        Mono<Map<String, Object>> workflowRunActivitiesByWorkflowIdMono =
                proxyWorkflowService.getWorkflowRunActivities("random-workflow-id", "random-run-id");

        StepVerifier.create(workflowRunActivitiesByWorkflowIdMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(WORKFLOW, "random-workflow-id"));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInvalidGetWorkflowRuns() {
        Mono<Map<String, Object>> workflowRunsByWorkflowIdMono =
                proxyWorkflowService.getWorkflowRuns("random-workflow-id", new LinkedMultiValueMap<>());

        StepVerifier.create(workflowRunsByWorkflowIdMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(WORKFLOW, "random-workflow-id"));
                    return true;
                })
                .verify();
    }
}
