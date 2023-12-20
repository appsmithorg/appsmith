package com.appsmith.server.workflows.interact;

import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApprovalRequestCreationDTO;
import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.ApprovalRequestRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.workflows.crud.CrudApprovalRequestService;
import com.appsmith.server.workflows.crud.CrudWorkflowService;
import com.appsmith.server.workflows.helpers.WorkflowProxyHelper;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static com.appsmith.server.constants.ApprovalRequestStatus.PENDING;
import static com.appsmith.server.constants.ApprovalRequestStatus.RESOLVED;
import static com.appsmith.server.constants.FieldName.REQUEST;
import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.constants.ce.FieldNameCE.VIEWER;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class InteractApprovalRequestServiceTest {
    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    CrudApprovalRequestService crudApprovalRequestService;

    @Autowired
    InteractApprovalRequestService interactApprovalRequestService;

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
    ApprovalRequestRepository approvalRequestRepository;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @SpyBean
    WorkflowProxyHelper workflowProxyHelper;

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

        User apiUser = userRepository.findByCaseInsensitiveEmail("api_user").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();

        Mockito.doReturn(Mono.just(new JSONObject()))
                .when(workflowProxyHelper)
                .updateApprovalRequestResolutionOnProxy(any());
    }

    @AfterEach
    void tearDown() {
        Workflow deletedCreatedWorkflow =
                workflowService.deleteWorkflow(workflow.getId()).block();
        Workspace deleteCreatedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidApprovalResolution_emptyWorkflowId() {
        String testName = "testInvalidApprovalResolution_emptyWorkflowId";

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        UserGroupDTO createdUserGroupDTO =
                userGroupService.createGroup(userGroup).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle, approvalRequestMessage, allowedResolutions, createdUser, createdUserGroupDTO);

        ApprovalRequestResolutionDTO approvalRequestResolutionDTO = new ApprovalRequestResolutionDTO();
        Mono<JSONObject> resolutionMono = runAs(
                interactApprovalRequestService.resolveApprovalRequest(approvalRequestResolutionDTO),
                createdUser,
                testName);

        StepVerifier.create(resolutionMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION.getMessage(
                                    "Workflow ID can't be empty"));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidApprovalResolution_emptyRequestId() {
        String testName = "testInvalidApprovalResolution_emptyRequestId";

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        UserGroupDTO createdUserGroupDTO =
                userGroupService.createGroup(userGroup).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle, approvalRequestMessage, allowedResolutions, createdUser, createdUserGroupDTO);

        ApprovalRequestResolutionDTO approvalRequestResolutionDTO = new ApprovalRequestResolutionDTO();
        approvalRequestResolutionDTO.setWorkflowId(workflow.getId());
        Mono<JSONObject> resolutionMono = runAs(
                interactApprovalRequestService.resolveApprovalRequest(approvalRequestResolutionDTO),
                createdUser,
                testName);

        StepVerifier.create(resolutionMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION.getMessage(
                                    "Request ID can't be empty"));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidApprovalResolution_emptyResolution() {
        String testName = "testInvalidApprovalResolution_emptyResolution";

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        UserGroupDTO createdUserGroupDTO =
                userGroupService.createGroup(userGroup).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle, approvalRequestMessage, allowedResolutions, createdUser, createdUserGroupDTO);

        ApprovalRequestResolutionDTO approvalRequestResolutionDTO = new ApprovalRequestResolutionDTO();
        approvalRequestResolutionDTO.setWorkflowId(workflow.getId());
        approvalRequestResolutionDTO.setRequestId(approvalRequest.getId());
        Mono<JSONObject> resolutionMono = runAs(
                interactApprovalRequestService.resolveApprovalRequest(approvalRequestResolutionDTO),
                createdUser,
                testName);

        StepVerifier.create(resolutionMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION.getMessage(
                                    "Resolution can't be empty"));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidApprovalResolution_invalidResolution() {
        String testName = "testInvalidApprovalResolution_invalidResolution";

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        String resolution3 = "resolution3";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle, approvalRequestMessage, allowedResolutions, createdUser, null);

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of(user.getUsername()));
        inviteUsersDTO.setPermissionGroupId(workspaceAdminRole.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        String approvalRequestResolutionReason = "Resolution Reason: " + testName;
        Mono<JSONObject> resolutionMono = resolveApprovalRequestInviteUser(
                approvalRequest, approvalRequestResolutionReason, resolution3, createdUser, testName);

        StepVerifier.create(resolutionMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION.getMessage(
                                    "Invalid resolution."));
                    return true;
                })
                .verify();

        ApprovalRequest resolvedApprovalRequest =
                approvalRequestRepository.findById(approvalRequest.getId()).block();
        assertThat(resolvedApprovalRequest).isNotNull();
        assertThat(resolvedApprovalRequest.getId()).isNotEmpty();
        assertThat(resolvedApprovalRequest.getTitle()).isEqualTo(approvalRequestTitle);
        assertThat(resolvedApprovalRequest.getDescription()).isEqualTo(approvalRequestMessage);
        assertThat(resolvedApprovalRequest.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(resolvedApprovalRequest.getResolutionStatus()).isEqualTo(PENDING);
        assertThat(resolvedApprovalRequest.getAllowedResolutions())
                .containsExactlyInAnyOrderElementsOf(allowedResolutions);
        assertThat(resolvedApprovalRequest.getResolution()).isNullOrEmpty();
        assertThat(resolvedApprovalRequest.getResolutionReason()).isNullOrEmpty();
        assertThat(resolvedApprovalRequest.getResolvedAt()).isNull();
        assertThat(resolvedApprovalRequest.getResolvedBy()).isNullOrEmpty();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidApprovalResolution_doubleResolution() {
        String testName = "testInvalidApprovalResolution_doubleResolution";

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        String resolution3 = "resolution3";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle, approvalRequestMessage, allowedResolutions, createdUser, null);

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of(createdUser.getUsername()));
        inviteUsersDTO.setPermissionGroupId(workspaceAdminRole.getId());

        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        String approvalRequestResolutionReason = "Resolution Reason: " + testName;
        Mono<JSONObject> resolutionMono = resolveApprovalRequestInviteUser(
                        approvalRequest, approvalRequestResolutionReason, resolution1, createdUser, testName)
                .flatMap(resolved1 -> resolveApprovalRequestInviteUser(
                        approvalRequest, approvalRequestResolutionReason, resolution1, createdUser, testName));

        StepVerifier.create(resolutionMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_RESOLUTION.getMessage(
                                    "Request already resolved."));
                    return true;
                })
                .verify();

        ApprovalRequest resolvedApprovalRequest =
                approvalRequestRepository.findById(approvalRequest.getId()).block();
        assertThat(resolvedApprovalRequest).isNotNull();
        assertThat(resolvedApprovalRequest.getId()).isNotEmpty();
        assertThat(resolvedApprovalRequest.getTitle()).isEqualTo(approvalRequestTitle);
        assertThat(resolvedApprovalRequest.getDescription()).isEqualTo(approvalRequestMessage);
        assertThat(resolvedApprovalRequest.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(resolvedApprovalRequest.getResolutionStatus()).isEqualTo(RESOLVED);
        assertThat(resolvedApprovalRequest.getAllowedResolutions())
                .containsExactlyInAnyOrderElementsOf(allowedResolutions);
        assertThat(resolvedApprovalRequest.getResolution()).isEqualTo(resolution1);
        assertThat(resolvedApprovalRequest.getResolutionReason()).isEqualTo(approvalRequestResolutionReason);
        assertThat(resolvedApprovalRequest.getResolvedAt()).isBefore(Instant.now());
        assertThat(resolvedApprovalRequest.getResolvedBy()).isEqualTo(createdUser.getUsername());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidApprovalResolution_noResolveAccessToApprovalRequest() {
        String testName = "testInvalidApprovalResolution_noResolveAccessToApprovalRequest";

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        User user1 = new User();
        user1.setEmail(testName + "1");
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        String resolution3 = "resolution3";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle, approvalRequestMessage, allowedResolutions, createdUser, null);

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of(createdUser.getUsername(), createdUser1.getUsername()));
        inviteUsersDTO.setPermissionGroupId(workspaceAdminRole.getId());

        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        String approvalRequestResolutionReason = "Resolution Reason: " + testName;
        Mono<JSONObject> resolutionMono = resolveApprovalRequestInviteUser(
                approvalRequest, approvalRequestResolutionReason, resolution1, createdUser1, testName);

        StepVerifier.create(resolutionMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(REQUEST, approvalRequest.getId()));
                    return true;
                })
                .verify();

        ApprovalRequest resolvedApprovalRequest =
                approvalRequestRepository.findById(approvalRequest.getId()).block();
        assertThat(resolvedApprovalRequest).isNotNull();
        assertThat(resolvedApprovalRequest.getId()).isNotEmpty();
        assertThat(resolvedApprovalRequest.getTitle()).isEqualTo(approvalRequestTitle);
        assertThat(resolvedApprovalRequest.getDescription()).isEqualTo(approvalRequestMessage);
        assertThat(resolvedApprovalRequest.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(resolvedApprovalRequest.getResolutionStatus()).isEqualTo(PENDING);
        assertThat(resolvedApprovalRequest.getAllowedResolutions())
                .containsExactlyInAnyOrderElementsOf(allowedResolutions);
        assertThat(resolvedApprovalRequest.getResolution()).isNullOrEmpty();
        assertThat(resolvedApprovalRequest.getResolutionReason()).isNullOrEmpty();
        assertThat(resolvedApprovalRequest.getResolvedAt()).isNull();
        assertThat(resolvedApprovalRequest.getResolvedBy()).isNullOrEmpty();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidApprovalResolution_errorFromWorkflowProxyOnResolution() {
        String testName = "testInvalidApprovalResolution_errorFromWorkflowProxyOnResolution";
        Mockito.doReturn(Mono.error(new AppsmithException(AppsmithError.WORKFLOW_PROXY_REQUEST_FAILED, "test", "test")))
                .when(workflowProxyHelper)
                .updateApprovalRequestResolutionOnProxy(any());

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle, approvalRequestMessage, allowedResolutions, createdUser, null);

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of(user.getUsername()));
        inviteUsersDTO.setPermissionGroupId(workspaceAdminRole.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        String approvalRequestResolutionReason = "Resolution Reason: " + testName;
        Mono<JSONObject> resolved = resolveApprovalRequestInviteUser(
                approvalRequest, approvalRequestResolutionReason, resolution1, createdUser, testName);

        StepVerifier.create(resolved)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.WORKFLOW_PROXY_REQUEST_FAILED.getMessage("test", "test"));
                    return true;
                })
                .verify();

        ApprovalRequest resolvedApprovalRequest =
                approvalRequestRepository.findById(approvalRequest.getId()).block();
        assertThat(resolvedApprovalRequest).isNotNull();
        assertThat(resolvedApprovalRequest.getId()).isNotEmpty();
        assertThat(resolvedApprovalRequest.getTitle()).isEqualTo(approvalRequestTitle);
        assertThat(resolvedApprovalRequest.getDescription()).isEqualTo(approvalRequestMessage);
        assertThat(resolvedApprovalRequest.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(resolvedApprovalRequest.getResolutionStatus()).isEqualTo(PENDING);
        assertThat(resolvedApprovalRequest.getAllowedResolutions())
                .containsExactlyInAnyOrderElementsOf(allowedResolutions);
        assertThat(resolvedApprovalRequest.getResolution()).isNullOrEmpty();
        assertThat(resolvedApprovalRequest.getResolutionReason()).isNullOrEmpty();
        assertThat(resolvedApprovalRequest.getResolvedAt()).isNull();
        assertThat(resolvedApprovalRequest.getResolvedBy()).isNullOrEmpty();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testValidApprovalRequestResolutionUserInvitedAsAdmin() {
        String testName = "testValidApprovalRequestResolutionUserInvitedAsAdmin";

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle, approvalRequestMessage, allowedResolutions, createdUser, null);

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setUsernames(List.of(user.getUsername()));
        inviteUsersDTO.setPermissionGroupId(workspaceAdminRole.getId());
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        String approvalRequestResolutionReason = "Resolution Reason: " + testName;
        JSONObject resolved = resolveApprovalRequestInviteUser(
                        approvalRequest, approvalRequestResolutionReason, resolution1, createdUser, testName)
                .block();

        assertThat(resolved.toString()).isEqualTo((new JSONObject()).toString());

        ApprovalRequest resolvedApprovalRequest =
                approvalRequestRepository.findById(approvalRequest.getId()).block();
        assertThat(resolvedApprovalRequest).isNotNull();
        assertThat(resolvedApprovalRequest.getId()).isNotEmpty();
        assertThat(resolvedApprovalRequest.getTitle()).isEqualTo(approvalRequestTitle);
        assertThat(resolvedApprovalRequest.getDescription()).isEqualTo(approvalRequestMessage);
        assertThat(resolvedApprovalRequest.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(resolvedApprovalRequest.getResolutionStatus()).isEqualTo(RESOLVED);
        assertThat(resolvedApprovalRequest.getAllowedResolutions())
                .containsExactlyInAnyOrderElementsOf(allowedResolutions);
        assertThat(resolvedApprovalRequest.getResolution()).isEqualTo(resolution1);
        assertThat(resolvedApprovalRequest.getResolutionReason()).isEqualTo(approvalRequestResolutionReason);
        assertThat(resolvedApprovalRequest.getResolvedAt()).isBefore(Instant.now());
        assertThat(resolvedApprovalRequest.getResolvedBy()).isEqualTo(createdUser.getUsername());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testValidApprovalRequestResolutionUserGroupInvitedAsAdmin() {
        String testName = "testValidApprovalRequestResolutionGroupInvitedAsAdmin";

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        userGroup.setUsers(Set.of(createdUser.getId()));
        UserGroupDTO createdUserGroupDTO =
                userGroupService.createGroup(userGroup).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle, approvalRequestMessage, allowedResolutions, null, createdUserGroupDTO);

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setGroups(Set.of(createdUserGroupDTO.getId()));
        inviteUsersDTO.setPermissionGroupId(workspaceAdminRole.getId());

        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        String approvalRequestResolutionReason = "Resolution Reason: " + testName;
        JSONObject resolved = resolveApprovalRequestInviteGroup(
                        approvalRequest,
                        approvalRequestResolutionReason,
                        resolution1,
                        createdUserGroupDTO,
                        createdUser,
                        testName)
                .block();

        assertThat(resolved.toString()).isEqualTo((new JSONObject()).toString());

        ApprovalRequest resolvedApprovalRequest =
                approvalRequestRepository.findById(approvalRequest.getId()).block();
        assertThat(resolvedApprovalRequest).isNotNull();
        assertThat(resolvedApprovalRequest.getId()).isNotEmpty();
        assertThat(resolvedApprovalRequest.getTitle()).isEqualTo(approvalRequestTitle);
        assertThat(resolvedApprovalRequest.getDescription()).isEqualTo(approvalRequestMessage);
        assertThat(resolvedApprovalRequest.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(resolvedApprovalRequest.getResolutionStatus()).isEqualTo(RESOLVED);
        assertThat(resolvedApprovalRequest.getAllowedResolutions())
                .containsExactlyInAnyOrderElementsOf(allowedResolutions);
        assertThat(resolvedApprovalRequest.getResolution()).isEqualTo(resolution1);
        assertThat(resolvedApprovalRequest.getResolutionReason()).isEqualTo(approvalRequestResolutionReason);
        assertThat(resolvedApprovalRequest.getResolvedAt()).isBefore(Instant.now());
        assertThat(resolvedApprovalRequest.getResolvedBy()).isEqualTo(createdUser.getUsername());
    }

    private ApprovalRequest createTestApprovalRequest(
            String approvalRequestTitle,
            String approvalRequestMessage,
            Set<String> allowedResolutions,
            User user,
            UserGroupDTO userGroupDTO) {
        ApprovalRequestCreationDTO approvalRequestCreationDTO = new ApprovalRequestCreationDTO();
        approvalRequestCreationDTO.setTitle(approvalRequestTitle);
        approvalRequestCreationDTO.setDescription(approvalRequestMessage);
        approvalRequestCreationDTO.setAllowedResolutions(allowedResolutions);
        approvalRequestCreationDTO.setWorkflowId(workflow.getId());
        approvalRequestCreationDTO.setRunId("random-run-id");
        if (Objects.nonNull(user)) {
            approvalRequestCreationDTO.setRequestToUsers(Set.of(user.getUsername()));
        }
        if (Objects.nonNull(userGroupDTO)) {
            approvalRequestCreationDTO.setRequestToGroups(Set.of(userGroupDTO.getId()));
        }

        return crudApprovalRequestService
                .createApprovalRequest(approvalRequestCreationDTO)
                .block();
    }

    private Mono<JSONObject> resolveApprovalRequestInviteUser(
            ApprovalRequest approvalRequest,
            String approvalRequestResolutionReason,
            String resolution,
            User user,
            String password) {
        ApprovalRequestResolutionDTO approvalRequestResolutionDTO = new ApprovalRequestResolutionDTO();
        approvalRequestResolutionDTO.setWorkflowId(workflow.getId());
        approvalRequestResolutionDTO.setRequestId(approvalRequest.getId());
        approvalRequestResolutionDTO.setResolution(resolution);
        approvalRequestResolutionDTO.setResolutionReason(approvalRequestResolutionReason);

        return runAs(
                interactApprovalRequestService.resolveApprovalRequest(approvalRequestResolutionDTO), user, password);
    }

    private Mono<JSONObject> resolveApprovalRequestInviteGroup(
            ApprovalRequest approvalRequest,
            String approvalRequestResolutionReason,
            String resolution,
            UserGroupDTO userGroupDTO,
            User user,
            String password) {

        ApprovalRequestResolutionDTO approvalRequestResolutionDTO = new ApprovalRequestResolutionDTO();
        approvalRequestResolutionDTO.setWorkflowId(workflow.getId());
        approvalRequestResolutionDTO.setRequestId(approvalRequest.getId());
        approvalRequestResolutionDTO.setResolution(resolution);
        approvalRequestResolutionDTO.setResolutionReason(approvalRequestResolutionReason);

        return runAs(
                interactApprovalRequestService.resolveApprovalRequest(approvalRequestResolutionDTO), user, password);
    }
}
